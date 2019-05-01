import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { formatDistance } from 'date-fns';
import Link from 'next/link';
import styled from 'styled-components';

import formatMoney from '../lib/formatMoney';
import OrderItemStyles from './styles/OrderItemStyles';
import Error from './ErrorMessage';

const USERS_ORDERS_QUERY = gql`
    query ordersQuery{
        orders(orderBy: createdAt_DESC){
            id
            items {
                id
                title
                description
                image
                price
                quantity
            }
            total
            createdAt
                }
    }
`;
const OrderUl = styled.ul`
    display: grid;
    grid-gap: 4rem;
    grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));
`;

export default class Orders extends Component {
  //   static propTypes = {
  //     prop: PropTypes,
  //   };

  render() {
    return (
      <Query query={USERS_ORDERS_QUERY}>
        {({ data: { orders }, loading, error }) => {
          if (loading) return <p>Loading...</p>;
          if (error) return <Error error={error} />;
          console.log(orders);

          return (
            <div>
              <h2>You have {orders.length} orders </h2>
              <OrderUl>
                {orders.map(order => (
                  <OrderItemStyles key={order.id}>
                    <Link
                      href={{
                        pathname: '/order',
                        query: { id: order.id },
                      }}
                    >
                      <a>
                        <div className="order-meta">
                          <p>
                            {order.items.reduce((a, b) => a + b.quantity, 0)}
                            {' '}
                            Items
                          </p>
                          <p>
                            {order.items.length} Products
                          </p>
                          <p>
                            {formatDistance(order.createdAt, new Date())}
                            {' '}
                            Ago
                            {' '}
                          </p>
                          <p>
                            {formatMoney(order.total)}
                          </p>
                        </div>
                        <div className="images">
                          {order.items.map(item => (
                            <img
                              key={item.id}
                              src={item.image}
                              alt={item.title}
                            />
                          ))}
                        </div>
                      </a>
                    </Link>
                  </OrderItemStyles>
                ))}
              </OrderUl>
            </div>
          );
        }}
      </Query>
    );
  }
}
