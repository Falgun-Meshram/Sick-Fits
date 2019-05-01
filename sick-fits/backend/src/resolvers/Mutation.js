const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');
const stripe = require('../stripe');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          user: {
            // This is how we create a relation  bewteen the item an the user
            connect: {
              id: ctx.request.userId,
            },
          },
          ...args,
        },
      },
      info
    );
    return item;
  },
  updateItem(parent, args, ctx, info) {
    const updates = { ...args };
    delete updates.id;

    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // Find the item
    const item = await ctx.db.query.item(
      { where },
      `{id 
        title 
        user {
        id
      }}`
    );
    // Check if the own the item or have the permission
    // TODO
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ['ADMIN,ITEMDELETE'].includes(permission)
    );
    if (!ownsItem && !hasPermissions) {
      throw new Error("you don't have the permission to do that");
    }
    // Delete it
    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    // Lowercase their email
    console.log('Inside signup');
    args.email = args.email.toLowerCase();
    // Hash their password
    const password = await bcrypt.hash(args.password, 10);
    // create the user in the database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] },
        },
      },
      info
    );
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    const User = await ctx.db.query.user({ where: { email } });
    if (!User) {
      throw new Error(`No such user found with the email ${email}`);
    }

    const valid = await bcrypt.compare(password, User.password);

    if (!valid) {
      throw new Error('Invalid Password!!');
    }
    const token = jwt.sign({ userId: User.id }, process.env.APP_SECRET);
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return User;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' };
  },
  async requestReset(parent, args, ctx, info) {
    const User = await ctx.db.query.user({ where: { email: args.email } });

    if (!User) {
      throw new Error(`No such user found with the email ${args.email}`);
    }

    const resetToken = (await promisify(randomBytes)(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1hour
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry },
    });

    const mailRes = transport.sendMail({
      from: 'falgun@meshram.com',
      to: User.email,
      subject: 'Your Password reset Token',
      html: makeANiceEmail(
        `Your Password reset token is here \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}" >Click here to reset </a>`
      ),
    });

    return { message: 'Thanks!' };
  },
  async resetPassword(parent, args, ctx, info) {
    // Check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error('Yo! Passwords do not match!');
    }
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });
    if (!user) {
      throw new Error('This token is expired or invalid');
    }
    const password = await bcrypt.hash(args.password, 10);

    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: { password, resetToken: null, resetTokenExpiry: null },
    });

    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    // Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in !');
    }

    // Query the current user
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId,
        },
      },
      info
    );
    // Check if they permission to this
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    // Update the permission
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions,
          },
        },
        where: {
          id: args.userId,
        },
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    // Check if they are signed
    const { userId } = ctx.request;
    if (!userId) throw new Error('You need to log in to do that!');

    // Query the current user's cart

    const [existingCartItem] = await ctx.db.query.cartItems(
      {
        where: {
          user: { id: userId },
          item: { id: args.id },
        },
      },
      info
    );

    // Check if it already in the cart
    if (existingCartItem) {
      return ctx.db.mutation.updateCartItem(
        {
          data: { quantity: existingCartItem.quantity + 1 },
          where: { id: existingCartItem.id },
        },
        info
      );
    }

    // If it is not then create a new cart item

    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId },
          },
          item: {
            connect: { id: args.id },
          },
        },
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {
    // Find the cart Item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: {
          id: args.id,
        },
      },
      `{id, user { id }}`
    );
    if (!cartItem) throw new Error('No cart tiem found');
    // Make sure they own it
    if (cartItem.user.id !== ctx.request.userId)
      throw new Error('Cheating!!! BAD Thing to do !');
    // Delete that item
    return ctx.db.mutation.deleteCartItem(
      {
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async createOrder(parent, args, ctx, info) {
    // Query the current user and check if they are signed it
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('You have to be logged in to for that');
    }
    const user = await ctx.db.query.user(
      {
        where: {
          id: userId,
        },
      },
      `{
        id 
        name 
        email 
        cart {
           id 
           quantity 
           item {
              title 
              price 
              id 
              description 
              image
              largeImage
            }
          }
        }`
    );
    // Recalculate the total price
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );
    console.log(`Going to charge for a total of ${amount} with args as `);
    console.log(args);

    // Create the stripe charge
    const charge = await stripe.charges.create({
      amount,
      currency: 'INR',
      source: args.token,
    });
    // Convert the charged items to Order items ( a new array of objects)
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } },
      };
      delete orderItem.id;
      return orderItem;
    });

    // Create the order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } },
      },
    });

    // Clear the user cart
    const cartItemIds = user.cart.map(cartItem => cartItem.id);

    // Delete the cart items
    await ctx.db.mutation.deleteManyCartItems({
      where: {
        id_in: cartItemIds,
      },
    });
    // Return the order to the user
    return order;
  },
};

module.exports = Mutations;
