import React from 'react';
import ErrorPage from '../../pages/ErrorPage.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          title="Something went wrong"
          message="The app hit an unexpected error and could not continue."
          detail={this.state.error?.message}
          primaryActionLabel="Try again"
          primaryAction={this.handleReset}
          secondaryActionLabel="Refresh page"
          secondaryAction={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
