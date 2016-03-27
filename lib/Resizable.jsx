// @flow
import {default as React, PropTypes} from 'react';
import {DraggableCore} from 'react-draggable';
import cloneElement from './cloneElement';

type Position = {
  deltaX: number,
  deltaY: number
};
type State = {
  resizing: boolean,
  width: number, height: number,
  slackW: number, slackH: number
};
type DragCallbackData = {
  node: HTMLElement,
  position: Position
};

export default class Resizable extends React.Component {

  static propTypes = {
    //
    // Required Props
    //

    // Require that one and only one child be present.
    children: PropTypes.element.isRequired,

    // Initial w/h
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,

    //
    // Optional props
    //

    // If you change this, be sure to update your css
    handleSize: PropTypes.array,

    // If true, will only allow width/height to move in lockstep
    lockAspectRatio: PropTypes.bool,

    // Min/max size
    minConstraints: PropTypes.arrayOf(PropTypes.number),
    maxConstraints: PropTypes.arrayOf(PropTypes.number),

    // Callbacks
    onResizeStop: PropTypes.func,
    onResizeStart: PropTypes.func,
    onResize: PropTypes.func,

    // These will be passed wholesale to react-draggable's DraggableCore
    draggableOpts: PropTypes.object
  };

  static defaultProps =  {
    handleSize: [20, 20],
    lockAspectRatio: false,
    minConstraints: [20, 20],
    maxConstraints: [Infinity, Infinity]
  };

  state: State = {
    resizing: false,
    width: this.props.width, height: this.props.height,
    slackW: 0, slackH: 0
  };

  componentWillReceiveProps(nextProps: Object) {
    // If parent changes height/width, set that in our state.
    if (!this.state.resizing &&
        (nextProps.width !== this.props.width || nextProps.height !== this.props.height)) {
      this.setState({
        width: nextProps.width,
        height: nextProps.height
      });
    }
  }

  lockAspectRatio(width: number, height: number, aspectRatio: number): [number, number] {
    height = width / aspectRatio;
    width = height * aspectRatio;
    return [width, height];
  }

  // If you do this, be careful of constraints
  runConstraints(width: number, height: number): [number, number] {
    let [min, max] = [this.props.minConstraints, this.props.maxConstraints];

    if (this.props.lockAspectRatio) {
      const ratio = this.state.width / this.state.height;
      height = width / ratio;
      width = height * ratio;
    }

    if (!min && !max) return [width, height];

    let [oldW, oldH] = [width, height];

    // Add slack to the values used to calculate bound position. This will ensure that if
    // we start removing slack, the element won't react to it right away until it's been
    // completely removed.
    let {slackW, slackH} = this.state;
    width += slackW;
    height += slackH;

    if (min) {
      width = Math.max(min[0], width);
      height = Math.max(min[1], height);
    }
    if (max) {
      width = Math.min(max[0], width);
      height = Math.min(max[1], height);
    }

    // If the numbers changed, we must have introduced some slack. Record it for the next iteration.
    slackW += (oldW - width);
    slackH += (oldH - height);
    if (slackW !== this.state.slackW || slackH !== this.state.slackH) {
      this.setState({slackW, slackH});
    }

    return [width, height];
  }

  /**
   * Wrapper around drag events to provide more useful data.
   *
   * @param  {String} handlerName Handler name to wrap.
   * @return {Function}           Handler function.
   */
  resizeHandler(handlerName: string, handlerAction: string): Function {
    return (e, {node, position}: DragCallbackData) => {
      const {deltaX, deltaY} = position;
      let width = this.state.width, height = this.state.height;
      let posX = 0, posY = 0;

        switch (handlerAction) {
            case 'nw-resize':
                width = this.state.width - deltaX, height = this.state.height - deltaY;
                posX = deltaX, posY = deltaY;
                break;
            case 'ne-resize':
                width = this.state.width + deltaX, height = this.state.height - deltaY;
                posX = 0, posY = deltaY;
                break;
            case 'sw-resize':
                width = this.state.width - deltaX, height = this.state.height + deltaY;
                posX = deltaX, posY = 0;
                break;
            case 'se-resize':
            default:
                width = this.state.width + deltaX, height = this.state.height + deltaY;
                posX = 0, posY = 0;
                break;
        }

      // Early return if no change
      let widthChanged = width !== this.state.width, heightChanged = height !== this.state.height;
      if (handlerName === 'onResize' && !widthChanged && !heightChanged) return;

      [width, height] = this.runConstraints(width, height);

      // Set the appropriate state for this handler.
      let newState = {};
      if (handlerName === 'onResizeStart') {
        newState.resizing = true;
      } else if (handlerName === 'onResizeStop') {
        newState.resizing = false;
      } else {
        // Early return if no change after constraints
        //if (width === this.state.width && height === this.state.height) return;

        newState = {
          width: width,
          height: height,
          posX: posX,
          posY: posY
        };

      }

      this.setState(newState, () => {
        this.props[handlerName] && this.props[handlerName](e, {node, size: {width: width, height: height, deltaX: posX, deltaY: posY}});
      });

    };
  }

  render(): React.Element {
    let p = this.props;
    let className = p.className ?
      `${p.className} react-resizable`:
      'react-resizable';

    // What we're doing here is getting the child of this element, and cloning it with this element's props.
    // We are then defining its children as:
    // Its original children (resizable's child's children), and
    // A draggable handle.
    return cloneElement(p.children, {
      ...p,
      className,
      children: [
        p.children.props.children,
        <DraggableCore
          {...p.draggableOpts}
          ref="draggable"
          onStop={this.resizeHandler('onResizeStop')}
          onStart={this.resizeHandler('onResizeStart')}
          onDrag={this.resizeHandler('onResize', 'nw-resize')}
          >
          <span className="react-resizable-handle nw-resize" />
        </DraggableCore>,
        <DraggableCore
          {...p.draggableOpts}
          ref="draggable"
          onStop={this.resizeHandler('onResizeStop')}
          onStart={this.resizeHandler('onResizeStart')}
          onDrag={this.resizeHandler('onResize', 'ne-resize')}
          >
          <span className="react-resizable-handle ne-resize" />
        </DraggableCore>,
        <DraggableCore
          {...p.draggableOpts}
          ref="draggable"
          onStop={this.resizeHandler('onResizeStop')}
          onStart={this.resizeHandler('onResizeStart')}
          onDrag={this.resizeHandler('onResize', 'se-resize')}
          >
          <span className="react-resizable-handle se-resize" />
        </DraggableCore>,
        <DraggableCore
          {...p.draggableOpts}
          ref="draggable"
          onStop={this.resizeHandler('onResizeStop')}
          onStart={this.resizeHandler('onResizeStart')}
          onDrag={this.resizeHandler('onResize', 'sw-resize')}
          >
          <span className="react-resizable-handle sw-resize" />
        </DraggableCore>
      ]
    });
  }
}
