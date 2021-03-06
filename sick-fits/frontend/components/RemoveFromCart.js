import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import styled from 'styled-components';

import { CURRENT_USER_QUERY } from './User';
import Error from '../components/ErrorMessage';

const REMOVE_FROM_CART_MUTATION = gql`
    mutation removeFromCart($id: ID!) {
        removeFromCart(id: $id){
            id
        }
    }
`;

const BigButton = styled.button`
    font-size: 3rem;
    background:none;
    border: 0;
    &:hover{
        color: ${props => props.theme.red};
        cursor: pointer;
    }
`;

export default class RemoveFromCart extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
  };

  update = (cache, payload) => {
    // Read the cache
    const data = cache.readQuery({
      query: CURRENT_USER_QUERY,
    });
    console.log(data);
    // remove the item
    const cartItemId = payload.data.removeFromCart.id;

    data.me.cart = data.me.cart.filter(cartItem => cartItem.id !== cartItemId);

    cache.writeQuery({
      query: CURRENT_USER_QUERY,
      data,
    });

    // write it back to the cache
  };

  render() {
    return (
      <Mutation
        mutation={REMOVE_FROM_CART_MUTATION}
        variables={{ id: this.props.id }}
        update={this.update}
        optimisticResponse={{
          __typename: 'Mutation',
          removeFromCart: {
            __typename: 'CartItem',
            id: this.props.id,
          },
        }}
      >
        {(removeFromCart, { loading, error }) => {
          if (loading) {
            return <p>Loading...</p>;
          }
          if (error) {
            return <Error error={error} />;
          }
          return (
            <BigButton
              title="DELETE ITEM"
              disabled={loading}
              onClick={() => {
                removeFromCart().catch(err => alert(err.message));
              }}
            >
              {' '}×
            </BigButton>
          );
        }}
      </Mutation>
    );
  }
}
