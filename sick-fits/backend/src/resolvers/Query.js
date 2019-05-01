const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),

  me(parent, args, ctx, info) {
    // CHeck if there is a current user id
    if (!ctx.request.userId) {
      return null;
    }
    return ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId,
        },
      },
      info
    );
  },

  async users(parent, args, ctx, info) {
    // Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('Please Log in first!!');
    }
    // Check if they have the permissions
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);

    return ctx.db.query.users({}, info);
  },
  async order(parent, args, ctx, info) {
    // Make sure they are logged in
    if (!ctx.request.userId) {
      throw new Error('You need to be logged in for this');
    }

    // Query the current order
    const order = await ctx.db.query.order(
      {
        where: {
          id: args.id,
        },
      },
      info
    );

    // Check if they have the permission to see this order
    const ownsOrder = order.user.id === ctx.request.userId;
    console.log(ctx.request.user);

    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes(
      'ADMIN'
    );

    // Return the order
    if (!ownsOrder || !hasPermissionToSeeOrder) {
      throw new Error("You can't see this");
    }
    return order;
  },

  async orders(parent, args, ctx, info) {
    // Check if they are logged in
    if (!ctx.request.userId)
      throw new Error(
        'You need to logged in to view your orders. Please Log in'
      );
    // Query their orders
    const { userId } = ctx.request;

    const orders = await ctx.db.query.orders(
      {
        where: {
          user: { id: userId },
        },
      },
      info
    );
    return orders;
  },
};

module.exports = Query;
