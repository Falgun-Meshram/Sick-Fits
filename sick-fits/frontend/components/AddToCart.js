import React, { Component } from 'react';
import gql from 'graphql-tag';
import { Mutation, Query } from 'react-apollo';
import PropTypes from 'prop-types';

import { CURRENT_USER_QUERY } from './User';

const ADD_TO_CART_MUTATION = gql`
  mutation addToCart($id: ID!){
    addToCart(id: $id){
      id
      quantity
    }
  }
`;

export default class AddToCart extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
  };

  render() {
    const { id } = this.props;
    return (
      <Mutation
        update={this.update}
        mutation={ADD_TO_CART_MUTATION}
        variables={{ id }}
        refetchQueries={[{ query: CURRENT_USER_QUERY }]}
      >
        {(addToCart, { error, loading }) => (
          <button onClick={addToCart} disabled={loading}>
            Add{loading ? 'ing' : ''} to the cart 🛒
          </button>
        )}
      </Mutation>
    );
  }
}
