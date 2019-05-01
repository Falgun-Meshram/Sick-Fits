import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import React from 'react';
import PropTypes from 'prop-types';

import Error from './ErrorMessage';
import Table from './styles/Table';
import SickButton from './styles/SickButton';
import { check } from 'graphql-anywhere';

const possiblePermissions = [
  'ADMIN',
  'USER',
  'ITEMCREATE',
  'ITEMUPDATE',
  'ITEMDELETE',
  'PERMISSIONUPDATE',
];

const UPDATE_PERMISSON_MUTATION = gql`
  mutation UPDATE_PERMISSON_MUTATION($permissions: [Permission], $userId: ID!){
    updatePermissions(permissions: $permissions, userId: $userId){
      id
      permissions
      name
      email
    }
  }
`;

const ALL_USERS_QUERY = gql`
    query ALL_USERS_QUERY {
        users{
            id
            name
            email
            permissions
        }
    }
`;

const Permission = props => (
  <Query query={ALL_USERS_QUERY}>
    {({ data, loading, error }) =>
      console.log(data) ||
      <div className="">
        <Error error={error} />
        <div className="">
          <p>Manage Permissions</p>
          <Table>
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                {possiblePermissions.map(permission => (
                  <th key={permission}>{permission}</th>
                ))}
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map(user => (
                <UserPermissions key={user.id} user={user} />
              ))}
            </tbody>
          </Table>
        </div>
      </div>}
  </Query>
);

class UserPermissions extends React.Component {
  static propTypes = {
    user: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      id: PropTypes.string,
      permissions: PropTypes.array,
    }).isRequired,
  };
  state = {
    permissions: this.props.user.permissions,
  };
  handlePermissionChange = e => {
    const checkbox = e.target;
    let updatedPermissions = [...this.state.permissions];
    if (checkbox.checked) {
      updatedPermissions.push(checkbox.value);
    } else {
      updatedPermissions = updatedPermissions.filter(
        permission => permission !== checkbox.value
      );
    }
    this.setState({
      permissions: updatedPermissions,
    });
    console.log(updatedPermissions);
  };

  render() {
    const user = this.props.user;
    return (
      <Mutation
        mutation={UPDATE_PERMISSON_MUTATION}
        variables={{
          permissions: this.state.permissions,
          userId: this.props.user.id,
        }}
      >
        {(updatePermissions, { loading, error }) => (
          <>
          {error && <tr><td colSpan="8"> <Error error={error} /></td></tr>}
          <tr>
            <td>{user.name}</td>
            <td>{user.email}</td>
            {possiblePermissions.map(permission => (
              <td key={permission}>
                <label htmlFor={`${user.id}-permission-${permission}`}>
                  <input
                    type="checkbox"
                    id={`${user.id}-permission-${permission}`}
                    value={permission}
                    checked={this.state.permissions.includes(permission)}
                    onChange={this.handlePermissionChange}
                  />
                </label>
              </td>
            ))}
            <td>
              <SickButton
                type="button"
                disabled={loading}
                onClick={updatePermissions}
              >
                UPDAT{loading ?  `ING` : `E`}
              </SickButton>
            </td>
          </tr>
          </>
        )}
      </Mutation>
    );
  }
}

export default Permission;
