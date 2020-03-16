import { connect } from "react-redux";
import React, { Component } from "react";
import { Button } from "react-bootstrap";
import Modal from 'react-modal';
import {Locales} from '../lang/language';

const confirmModalStyles = {
  overlay: {zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.3)"},
  content : {
    top: '40%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    width: '500px',
    height: '330px',
    transform : 'translate(-50%, -50%)',
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
  }
}

class ConfirmDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: props.content,
      confirmCB: props.confirmCB,
      cancelCB: props.cancelCB
    };
  }

  render() {
    return (
      <Modal
        isOpen={true}
        style={confirmModalStyles}
        onRequestClose={this.state.cancelCB}
        shouldCloseOnOverlayClick={true}
        contentLabel="">
        <div width="100%" style={{textAlign: "center", paddingTop: "30px"}}>
          <span style={{fontSize: "36px"}}>{this.state.content}</span>
          <div className="confirmBtn">
            <Button onClick={this.state.cancelCB}>{Locales.common.取消}</Button>
            <Button onClick={this.state.confirmCB}>{Locales.common.確定}</Button>
          </div>
        </div>
      </Modal>
    );
  }
}

function mapStateToProps({  }, ownProps) {
  return {  };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, {  })(ConfirmDialog);
