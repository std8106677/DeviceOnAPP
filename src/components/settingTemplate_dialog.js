import { connect } from "react-redux";
import React, { Component } from "react";
import { Button } from "react-bootstrap";
import Modal from "react-modal";
import {Locales} from '../lang/language';

let SettingTemplateModalStyles = {
  overlay: {
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)"
  },
  content: {
    top: "50%",
    left: "50%",
    width: "500px",
    height: "80%",
    transform: "translate(-50%, -50%)",
    padding:"10px 20px",
    boxShadow:
      "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
  }
};
const ButtonStyle = {
  marginLeft: "10px",
  width: "185px",
  height: "50px",
  color: "white",
  borderColor: "white",
  backgroundColor: "#077598",
  fontSize: "18px"
};
const CancelButtonStyle = {
  marginRight: "10px",
  width: "185px",
  height: "50px",
  color: "#077598",
  borderColor: "#077598",
  backgroundColor: "white",
  fontSize: "18px"
};
class SettingTemplateDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: props.isOpen === true ? true : false,
      shouldCloseOnOverlayClick:
        props.shouldCloseOnOverlayClick === true ? true : false,
      title: props.modalTitle,
      contentLabel: props.contentLabel === undefined ? "" : props.contentLabel,
      confirmCB: props.confirmCB,
      cancelCB: props.cancelCB
    };
    if (props.width) {
      SettingTemplateModalStyles.content.width = props.width;
    }
    if (props.height) {
      SettingTemplateModalStyles.content.height = props.height;
    }
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      isOpen: nextProps.isOpen === true ? true : false,
      shouldCloseOnOverlayClick:
      nextProps.shouldCloseOnOverlayClick === true ? true : false,
      title: nextProps.modalTitle,
      contentLabel: nextProps.contentLabel === undefined ? "" : nextProps.contentLabel,
      confirmCB: nextProps.confirmCB,
      cancelCB: nextProps.cancelCB
    });
    //動熊設定高
    // setTimeout(function() {
    //   if (document.getElementById("SettingTemplateDialogContent")) {
    //     const contentHeight = document.getElementById(
    //       "SettingTemplateDialogContent"
    //     ).offsetHeight;

    //     let dialogHeight = contentHeight + 30 + 50 + 40 + 42; //內容+標題+按鈕+padding+其他
    //     let maxHeight = document.documentElement.clientHeight * 0.85 ;
    //     if  (dialogHeight > maxHeight) dialogHeight = maxHeight;
    //     document.getElementById(
    //       "SettingTemplateDialogContent"
    //     ).parentElement.style.height = dialogHeight + "px";
    //   }
    // }, 0);
  }
  render() {
    const {
      isOpen,
      shouldCloseOnOverlayClick,
      title,
      contentLabel,
      cancelCB,
      confirmCB
    } = this.state;
    const {cancelDisplay,confirmDisplay} = this.props;
    let cancelDisplayBtn = true;
    let confirmDisplayBtn = true;
    if(cancelDisplay===false){
        cancelDisplayBtn = cancelDisplay;
    }
    if(confirmDisplay===false){
        confirmDisplayBtn = confirmDisplay;
    }
    return (
      <Modal
        isOpen={isOpen}
        style={SettingTemplateModalStyles}
        onRequestClose={cancelCB}
        shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
        contentLabel={contentLabel}
        id="SettingTemplateDialog"
      >
        <div style={{ fontSize: "20px", fontWeight: "bold" }}>{title}</div>

        {this.props.children &&<div
          id="SettingTemplateDialogContent"
          className="SettingTemplateDialogContent"
          width="100%"
          style={{
            marginTop: "10px",
            overflowX: "auto",
            marginBottom: "10px"
          }}
        >
          {this.props.children}
        </div>}
        <div style={{ textAlign: "center" ,marginTop: "10px"}}>
          {cancelDisplayBtn  && <Button onClick={cancelCB} style={CancelButtonStyle}>
            {Locales.common.取消}
          </Button>}
          {confirmDisplayBtn && <Button onClick={confirmCB} style={ButtonStyle}>
            {Locales.common.確定}
          </Button>}
        </div>
      </Modal>
    );
  }
}

function mapStateToProps({}, ownProps) {
  return {};
}

//this.props.fetchPost
//this.props.deletePost
export default connect(
  mapStateToProps,
  {}
)(SettingTemplateDialog);
