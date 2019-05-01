import React, { Component } from 'react';
import { Mutation, Query } from 'react-apollo';
import gql from 'graphql-tag';

import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const REQUEST_RESET_MUTATION = gql`
    mutation REQUEST_RESET_MUTATION($email: String!){
        requestReset(email: $email){
            message
        }
    }
`;

export default class RequestReset extends Component {
  state = {
    email: '',
  };
  saveToState = e => {
    console.log(e.target.name);
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  render() {
    return (
      <Mutation mutation={REQUEST_RESET_MUTATION} variables={this.state}>
        {(reset, { error, loading, called }) => (
          <Form
            method="post"
            onSubmit={async e => {
              e.preventDefault();
              const res = await reset();
              this.setState({
                email: '',
              });
            }}
          >
            <fieldset disabled={loading} aria-busy={loading}>
              <h2>Request a Password Reset</h2>
              <Error error={error} />
              {!error &&
                !loading &&
                called &&
                <p>Success! Check your email for a reset link.</p>}
              <label htmlFor="email">
                Email
                <input
                  type="email"
                  name="email"
                  placeholder="email"
                  value={this.state.email}
                  onChange={this.saveToState}
                />
              </label>
              <button type="submit">Request Reset</button>
            </fieldset>
          </Form>
        )}

      </Mutation>
    );
  }
}
