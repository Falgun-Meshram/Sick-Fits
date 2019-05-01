import PropTypes from 'prop-types';

import ResetComponent from '../components/Reset';

const Reset = props => (
  <div>
    <p>Reset your password</p>
    <ResetComponent resetToken={props.query.resetToken} />
  </div>
);
Reset.propTypes = {
  query: PropTypes.object,
};
export default Reset;
