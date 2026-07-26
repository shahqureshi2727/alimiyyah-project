import { Component } from 'react';
import { createErrorReferenceId } from '../lib/error-reference';

function DefaultFallback({
  title,
  message,
  detail,
  errorReferenceId,
  onReload,
  onReset,
  resetLabel,
}) {
  return (
    <section className="error-fallback" role="alert">
      <div className="error-fallback-content">
        <p className="error-fallback-kicker">Reference {errorReferenceId}</p>
        <h1>{title}</h1>
        <p>{message}</p>
        {detail && <pre className="error-fallback-detail">{detail}</pre>}
        <div className="error-fallback-actions">
          {onReset && (
            <button type="button" className="secondary-btn" onClick={onReset}>
              {resetLabel || 'Try again'}
            </button>
          )}
          {onReload && (
            <button type="button" className="primary-btn" onClick={onReload}>
              Reload
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      errorReferenceId: createErrorReferenceId(),
      resetKey: props.resetKey,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      error,
      errorReferenceId: createErrorReferenceId(),
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return {
        error: null,
        errorReferenceId: createErrorReferenceId(),
        resetKey: props.resetKey,
      };
    }
    return null;
  }

  componentDidCatch(err, info) {
    import('../lib/logger').then(({ error: logError }) => {
      logError(`${this.props.name || 'React'} boundary caught a render error.`, err, {
        componentStack: info.componentStack,
        errorReferenceId: this.state.errorReferenceId,
      });
    });
  }

  reset = () => {
    this.setState({
      error: null,
      errorReferenceId: createErrorReferenceId(),
      resetKey: this.props.resetKey,
    });
  };

  render() {
    if (!this.state.error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({
        error: this.state.error,
        errorReferenceId: this.state.errorReferenceId,
        reset: this.reset,
      });
    }

    return (
      <DefaultFallback
        title={this.props.title || 'This part of Qasas Practice stopped working.'}
        message={
          this.props.message ||
          'Reload the page. If it happens again, send the reference ID to your teacher.'
        }
        errorReferenceId={this.state.errorReferenceId}
        detail={this.props.showErrorMessage ? this.state.error?.message : null}
        onReload={() => window.location.reload()}
        onReset={this.props.onReset ? this.reset : null}
        resetLabel={this.props.resetLabel}
      />
    );
  }
}
