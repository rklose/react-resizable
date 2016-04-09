// @flow
import {default as React, PropTypes} from 'react';
import merge from 'merge';
import Resizable from './Resizable';

type State = {width: number, height: number, aspectRatio: number};
type Size = {width: number, height: number, deltaX: number, deltaY: number};
type ResizeData = {element: Element, size: Size};

// An example use of Resizable.
export default class ResizableBox extends React.Component {
  static propTypes = {
    height: PropTypes.number,
    width: PropTypes.number
  };

  static defaultProps = {
    handleSize: [20,20]
  };

  state: State = {
    width: this.props.width,
    height: this.props.height,
  };

  onResize = (event, {element, size}) => {
    let {width, height, deltaX, deltaY} = size;

    this.setState(size, () => {
      this.props.onResize && this.props.onResize(event, {element, size});
    });
  };
  onResize: (event: Event, data: ResizeData) => void;

  render(): React.Element {
    // Basic wrapper around a Resizable instance.
    // If you use Resizable directly, you are responsible for updating the child component
    // with a new width and height.
    let {handleSize, onResizeStart, onResizeStop, draggableOpts,
         minConstraints, maxConstraints, lockAspectRatio, ...props} = this.props;

    var style = {
        width: (typeof this.state.width !== 'undefined') ? this.state.width + 'px' : 'auto',
        height: (typeof this.state.height !== 'undefined') ? this.state.height + 'px' : 'auto'
    };

    var resizableProps = {};
    if (typeof this.state.width !== 'undefined') {
      resizableProps = merge(resizableProps, {width: this.state.width});
    }

    if (typeof this.state.height !== 'undefined') {
      resizableProps = merge(resizableProps, {height: this.state.height});
    }

    return (
      <Resizable
        handleSize={handleSize}
        onResizeStart={onResizeStart}
        onResize={this.onResize}
        onResizeStop={onResizeStop}
        draggableOpts={draggableOpts}
        minConstraints={minConstraints}
        maxConstraints={maxConstraints}
        lockAspectRatio={lockAspectRatio}
        {...resizableProps}
        >
        <div style={style} {...props} />
      </Resizable>
    );
  }
}
