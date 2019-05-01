import PropTypes from 'prop-types';

import PleaseSignIn from '../components/PleaseSignIn';
import Order from '../components/Order';

const OrderPage = props => (
  <PleaseSignIn>
    <Order id={props.query.id} />
  </PleaseSignIn>
);

OrderPage.propTypes = {
  query: PropTypes.object.isRequired,
};

export default OrderPage;
