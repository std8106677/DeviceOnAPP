import React, { Component } from "react";
import { Container, Row, Col } from 'reactstrap';
import Modal from 'react-modal';
import { connect } from "react-redux";
import { setStore, setPosition, setSensor, setTemp, setPage } from "../actions";
import { apiLogout,apiIslogin } from "../utils/api";
import { parseStoreType } from "../utils/common";
import { Tab, Tabs, Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { Redirect } from "react-router-dom";
import MultiSelect from '@khanacademy/react-multi-select';
import Select from 'react-select';
import { Locales } from "../lang/language";

Modal.setAppElement(document.querySelector(".container"));

const customStyles = {
  overlay: {zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.3)"},
  content : {
    top: '80px',
    left: '300px',
    right: 'auto',
    bottom: 'auto',
    width: '70%',
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
  }
};
const userModalStyles = {
  overlay: {zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.3)"},
  content : {
    top: '80px',
    left: 'auto',
    right: '10px',
    bottom: 'auto',
    width: '200px',
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
  }
}

class TopBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showStoreModal: false,
      showUserModal: false,
      redirectMainPage: false,
      logout: false
    };
  }

  handleLogout = () => {
    const {token} = this.props;
    apiLogout(token)
    .then(function(response) {
      if ( response.data.status == 1 ) {
      } else {
        console.log("logout error : ", response);
      }
      this.setState({logout: true});
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  handleClickMainPage = () => {
    const {token} = this.props;
    apiIslogin(token)
    .then(function(response) {
      if ( response.data.isLogin ) {
        this.setState({redirectMainPage: true});
        this.props.setPage("overview");
      } else {
        this.setState({logout:true});
      }
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  handleOpenStoreModal = () => {
    this.setState({ showStoreModal: true });
  }
  handleCloseStoreModal = () => {
    this.setState({ showStoreModal: false });
  }

  handleOpenUserModal = () => {
    this.setState({ showUserModal: true });
  }
  handleCloseUserModal = () => {
    this.setState({ showUserModal: false });
  }

  renderStoreTab() {
    const {store} = this.props;
    var storeTypeList = [];
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].type_name && !storeTypeList.includes(store[i].type_name)) {
        storeTypeList.push(store[i].type_name);
      }
    }
    storeTypeList = parseStoreType(storeTypeList);
    return _.map(storeTypeList, storeType => {
      return (
        <Tab eventKey={storeType} key={storeType} title={storeType}>
          <Container style={{width: '100%', margin: "30px 0"}}>
            <Row>
              { this.renderStoreList(storeType) }
            </Row>
          </Container>
        </Tab>
      );
    });
  }

  renderStoreList(storeType) {
    const {store} = this.props;
    var storeList = [];
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].type_name == storeType) {
        storeList.push(store[i]);
      }
    }
    return _.map(storeList, store => {
      return (
        <Col key={store.branch_id} md={2}>
          <input type="radio" checked={store.select} onChange={() => this.handleStoreChange(store)}/>
          <span style={{paddingLeft: "10px", cursor: "pointer",position: "fixed"}} onClick={() => this.handleStoreChange(store)}>{store.branch_name}</span>
        </Col>
      );
    });
  }

  handleStoreChange(selectStore) {
    const {store} = this.props;
    var tmpStoreList = JSON.parse(JSON.stringify(store));
    for(let i=0 ; i<tmpStoreList.length ; ++i) {
      if(tmpStoreList[i].branch_id == selectStore.branch_id) {
        tmpStoreList[i].select = true;
      } else {
        tmpStoreList[i].select = false;
      }
    }
    this.props.setStore(tmpStoreList);
  }

  render() {
    if(this.state.redirectMainPage) {
      return <Redirect to='/main'/>;
    } else if (this.state.logout) {
      return <Redirect to='/'/>;
    }
    const {page_backend, store, user} = this.props;
    var selectStore = {};
    for(let i=0 ; i<store.length ; ++i) {
      if(store[i].select == true) {
        selectStore = store[i];
      }
    }
    let checkMain = false;
    if(user.user_id && user.auth_info.webpage ){
      let mainWebAuth = user.auth_info.webpage.find(x=>(x.page_id =="ReportExport" && x.auth.indexOf("read") > -1) || (x.page_id =="WatchData" && x.auth.indexOf("read") > -1));
      let mainOverviewAuth = user.auth_info.config_tool.find(x=>(x.page_id =="Web" && x.auth.indexOf("read") > -1));
      checkMain = (mainWebAuth || mainOverviewAuth) ? true : false;
    }
    return (
      <div>
        <div className="TopBar">
          <div style={{
            position: "absolute",
            display: page_backend == "sensor" || page_backend == "freezer" || page_backend == "correction" ||
                     page_backend == "watch_schedule" || page_backend == "freezer_history" ? "block" : "none",
            paddingTop: "20px"}}>
            <span style={{paddingLeft: "30px", color: "white"}}>{Locales.common.請選擇您欲查詢位置}：</span>
            <span className="SelectStore" onClick={this.handleOpenStoreModal}>
              <img src="../img/pos.svg" style={{width: "20px", height: "20px", margin: "0 5px 5px 0"}}></img>
              {selectStore.branch_name}
            </span>
          </div>
          <span className="UserInfo" onClick={this.handleOpenUserModal}>
            <img src="../img/user.svg" style={{width: "40px", height: "40px", marginRight: "20px"}}></img>
            <span style={{marginRight: "10px"}}>{user.name}</span>
            <span className="Arrow"></span>
          </span>
          <Modal
            isOpen={this.state.showStoreModal}
            style={customStyles}
            onRequestClose={this.handleCloseStoreModal}
            shouldCloseOnOverlayClick={true}
            contentLabel="Minimal Modal Example">
            <Tabs id="storeTabs" className="tabStyle" animation={false}>
              { this.renderStoreTab() }
            </Tabs>
          </Modal>
          <Modal
            isOpen={this.state.showUserModal}
            style={userModalStyles}
            onRequestClose={this.handleCloseUserModal}
            shouldCloseOnOverlayClick={true}
            contentLabel="">
            {checkMain && <div style={{marginBottom: "10px", cursor: "pointer"}} onClick={this.handleClickMainPage}>{Locales.common.前台}</div>}
            <div style={{cursor: "pointer"}} onClick={this.handleLogout}>{Locales.common.登出}</div>
          </Modal>
        </div>
      </div>
    );
  }
}

function mapStateToProps({ store, page_backend, language, token,user }, ownProps) {
  return { store, page_backend, language, token,user };
}


//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, { setStore ,setPage})(TopBar);
