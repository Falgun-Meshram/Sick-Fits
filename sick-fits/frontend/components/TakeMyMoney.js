import React, { Component } from 'react';
import StriptCheckout from 'react-stripe-checkout';
import { Mutation } from 'react-apollo';
import Router from 'next/router';
import NProgress from 'nprogress';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';

import calcTotalPrice from '../lib/calcTotalPrice';
import Error from './ErrorMessage';
import User, { CURRENT_USER_QUERY } from './User';

const CREATE_ORDER_MUTATION = gql`
    mutation createOrder($token: String!) {
        createOrder(token: $token){
            id
            charge
            total
            items{
                id
                title
            }
        }
    }
`;

function totalItems(cart) {
  return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0);
}

export default class TakeMyMoney extends Component {
  // static proptTypes ={
  //     children:
  // }
  onToken = async (res, createOrder) => {
    NProgress.start();
    console.log(`On token called with value \n ${JSON.stringify(res)}`);
    console.log(res.id);
    // CAll the mutation
    const order = await createOrder({
      variables: {
        token: res.id,
      },
    }).catch(err => alert(err.message));
    console.log(order.data.createOrder.id);
    Router.push({
      pathname: '/order',
      query: { id: order.data.createOrder.id },
    });
  };
  render() {
    return (
      <User>
        {({ data: { me } }) => (
          <Mutation
            mutation={CREATE_ORDER_MUTATION}
            refetchQueries={[{ query: CURRENT_USER_QUERY }]}
          >
            {createOrder => (
              <StriptCheckout
                amount={calcTotalPrice(me.cart)}
                name="Sick Fits"
                description={`Order of ${totalItems(me.cart)} items`}
                image={me.cart[0] && me.cart[0].item && me.cart[0].item.image}
                stripeKey="pk_test_h9F4a7W8U5wN4fv4N18zrIdq00c8P3v4IW"
                currency="INR"
                email={me.email}
                token={res => this.onToken(res, createOrder)}
              >
                {this.props.children}
              </StriptCheckout>
            )}
          </Mutation>
        )}
      </User>
    );
  }
}
