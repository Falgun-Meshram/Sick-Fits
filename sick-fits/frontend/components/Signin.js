import React, { Component } from 'react';
import { Mutation, Query } from 'react-apollo';
import gql from 'graphql-tag';

import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const SIGNIN_MUTATION = gql`
    mutation SIGNUP_MUTATION($email: String!, $password: String!){
        signin(email: $email, password: $password){
            id
            name
            email
        }
    }
`;

export default class Signin extends Component {
  state = {
    name: '',
    password: '',
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
      <Mutation
        refetchQueries={[{ query: CURRENT_USER_QUERY }]}
        mutation={SIGNIN_MUTATION}
        variables={this.state}
      >
        {(signup, { error, loading }) => (
          <Form
            method="post"
            onSubmit={async e => {
              e.preventDefault();
              const res = await signup();
              this.setState({
                name: 'Testing',
                password: '',
                email: '',
              });
            }}
          >
            <fieldset disabled={loading} aria-busy={loading}>
              <h2>Sign into your Account</h2>
              <Error error={error} />
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
              <label htmlFor="password">
                Password
                <input
                  type="password"
                  name="password"
                  placeholder="password"
                  value={this.state.password}
                  onChange={this.saveToState}
                />
              </label>
              <button type="submit">Sign In!</button>
            </fieldset>
          </Form>
        )}

      </Mutation>
    );
  }
}
