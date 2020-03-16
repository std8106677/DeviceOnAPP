import React, { Component } from "react";
import { Container, Row, Col } from 'reactstrap';
import Modal from 'react-modal';
import { connect } from "react-redux";
import { setStore, setStoreDepartment, setPageBackend, setUpdateData } from "../actions";
import { apiLogout, apiIslogin } from "../utils/api";
import { parseStoreType, parseStoreRegion } from "../utils/common";
import { Tab, Tabs, Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { Redirect } from "react-router-dom";
import MultiSelect from '@khanacademy/react-multi-select';
import Select from 'react-select';
import { Locales } from "../lang/language";
import moment from 'moment';
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
      store: [],
      redirectBackendPage: false,
      logout: false,
      lastUpdateTime: ""
    };
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.updateData && nextProps.updateData.time != this.state.lastUpdateTime) {
      this.setState({lastUpdateTime: nextProps.updateData.time});
    }
  }

  handleSelectedChanged(selected) {
    const {storeDepartment}=this.props;
    var tmpStoreDepartment = JSON.parse(JSON.stringify(storeDepartment));
    for(var i=0 ; i<tmpStoreDepartment.length ; ++i) {
      tmpStoreDepartment[i].select = selected.includes(tmpStoreDepartment[i].id);
    }
    this.props.setStoreDepartment(tmpStoreDepartment);
  }

  handleLogout = () => {
    const {token} = this.props;
    apiLogout(token)
    .then(function (response) {
      //console.log("apiLogout, ", response);
      if ( response.data.status == 1 ) {
      } else {
        console.log("logout error : ", response);
      }
      this.setState({logout:true});
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  handleClickBackendPage = () => {
    const {token} = this.props;
    apiIslogin(token)
    .then(function (response) {
      if ( response.data.isLogin) {
        this.setState({redirectBackendPage: true});
        this.props.setPageBackend("store")
      } else {
        this.setState({logout:true});
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  handleOpenStoreModal = () => {
    const {store}=this.props;
    var tmpStore = JSON.parse(JSON.stringify( store ));
    this.setState({ showStoreModal: true, store: tmpStore });
  }
  handleCloseStoreModal = () => {
    this.props.setStore(this.state.store);
    this.setState({ showStoreModal: false });
  }

  handleOpenUserModal = () => {
    this.setState({ showUserModal: true });
  }
  handleCloseUserModal = () => {
    this.setState({ showUserModal: false });
  }

  handleClickRefresh = () => {
    const {page, updateData} = this.props;
    this.props.setUpdateData({page: page, time: updateData.time});
  }

  getStoresLabel = () => {
    const {store} = this.props;
    var storesLabel = Locales.common.請選擇位置, isAll = true, selectStores = [];
    for(var i=0 ; i<store.length ; ++i) {
      if(store[i].select == false) {
        isAll = false;
      } else {
        selectStores.push(store[i].branch_name);
      }
    }
    if(isAll) {
      storesLabel = Locales.common.所有位置;
    } else {
      for(var i=0 ; i<selectStores.length ; ++i) {
        if(i==0) {
          storesLabel = selectStores[i];
        } else if(i<3) {
          storesLabel += ('、'+selectStores[i]);
        } else {
          storesLabel +=  Locales.common.及其他間位置.format(selectStores.length-3)//('及其他' + (selectStores.length-3) + '間位置');
          break;
        }
      }
    }
    return storesLabel;
  }

  handleStoreGroupChange = (storeType, region, isSelect) => {
    var tmpStoreList = JSON.parse(JSON.stringify(this.state.store));
    for(var i=0 ; i<tmpStoreList.length ; ++i) {
      if(tmpStoreList[i].type_name == storeType && (tmpStoreList[i].region_name == region || region.includes(Locales.common.所有))) {
        tmpStoreList[i].select = !isSelect;
      }
    }
    this.setState({store: tmpStoreList});
  }

  renderStoreTab() {
    //console.log("this.state.store, ", this.state.store);
    var storeTypeList = [];
    for(var i=0 ; i<this.state.store.length ; ++i) {
      if(this.state.store[i].type_name && !storeTypeList.includes(this.state.store[i].type_name)) {
        storeTypeList.push(this.state.store[i].type_name);
      }
    }
    storeTypeList = parseStoreType(storeTypeList);
    return _.map(storeTypeList, storeType => {
      return (
        <Tab eventKey={storeType} key={storeType} title={storeType}>
          <table style={{marginTop: "30px", border: "1px solid #CAD0D6"}}>
            <tbody>
              <tr>
                { this.renderStoreRegion(storeType) }
              </tr>
            </tbody>
          </table>
          <Container style={{width: '100%', margin: "30px 0"}}>
            <Row>
              { this.renderStoreList(storeType) }
            </Row>
          </Container>
        </Tab>
      );
    });
  }

  renderStoreRegion(storeType) {
    var storeRegionList = [];
    for(var i=0 ; i<this.state.store.length ; ++i) {
      if(this.state.store[i].type_name == storeType && this.state.store[i].region_name && !storeRegionList.includes(this.state.store[i].region_name)) {
        storeRegionList.push(this.state.store[i].region_name);
      }
    }
    storeRegionList = parseStoreRegion(storeRegionList);
    storeRegionList.unshift(Locales.common.所有 + storeType);
    return _.map(storeRegionList, region => {
      var isSelect = true;
      for (var i=0 ; i<this.state.store.length ; ++i) {
        if (region.includes(Locales.common.所有)) {
          if(this.state.store[i].type_name == storeType && this.state.store[i].select == false) {
            isSelect = false;
            break;
          }
        } else {
          if(this.state.store[i].type_name == storeType && this.state.store[i].region_name == region && this.state.store[i].select == false) {
            isSelect = false;
            break;
          }
        }
      }
      return (
        <td key={region} style={{paddingLeft: "20px", paddingRight: "20px"}}>
          <span style={{border: "1px solid white", float: "left", padding: "5px"}}>
            <input type="checkbox" checked={isSelect} onChange={() => this.handleStoreGroupChange(storeType, region, isSelect)}/>
          </span>
          <span style={{border: "1px solid white", float: "left", minWidth: "50px", padding: "6px", marginLeft: "-1px", cursor: "pointer"}}
                onClick={() => this.handleStoreGroupChange(storeType, region, isSelect)}>{region}</span>
        </td>
      );
    });
  }

  renderStoreList(storeType) {
    var storeList = [];
    let  viewWidth = window.innerWidth * 0.7 -40 - 30*6 ;

    for(var i=0 ; i<this.state.store.length ; ++i) {
      if(this.state.store[i].type_name == storeType) {
        storeList.push(this.state.store[i]);
      }
    }
    return _.map(storeList, store => {
      return (
        <Col key={store.branch_id} md={2}>
          <input type="checkbox" checked={store.select} onChange={() => this.handleStoreChange(store)}/>
          <span
           style={{paddingLeft: "10px", cursor: "pointer",position: "fixed", overflow : "hidden",
                textOverflow : "ellipsis",  whiteSpace : "nowrap",width:`${viewWidth/ 6}px`}}
            onClick={() => this.handleStoreChange(store)}>{store.branch_name}</span>
        </Col>
      );
    });
  }

  handleStoreChange(store) {
    var tmpStoreList = JSON.parse(JSON.stringify(this.state.store));
    for(var i=0 ; i<tmpStoreList.length ; ++i) {
      if(tmpStoreList[i].branch_id == store.branch_id) {
        tmpStoreList[i].select = !tmpStoreList[i].select;
        this.setState({store: tmpStoreList});
        break;
      }
    }
  }

  render() {
    if (this.state.redirectBackendPage) {
      return <Redirect to='/backend'/>;
    } else if (this.state.logout) {
      return <Redirect to='/'/>;
    }
    const {page, storeDepartment, user}=this.props;
    var options = [], selected = [];
    for(var i=0 ; i<storeDepartment.length ; ++i) {
      options.push({label: storeDepartment[i].name, value: storeDepartment[i].id});
      if(storeDepartment[i].select) {
        selected.push(storeDepartment[i].id);
      }
    }
    let checkSetting = false;
    if(user.user_id && user.auth_info.webpage ){
      let settingAuth = user.auth_info.webpage.find(x=>(x.page_id =="Setting" && x.auth.indexOf("read") > -1) ||( x.page_id == "CalibrationRecord" && x.auth.indexOf("read")> -1));
      checkSetting = settingAuth ? true:false;
    }

    let  viewWidth = "100%" ;
    if (window.innerWidth  < 1200){
      viewWidth = "120px"
    }else  if (window.innerWidth  < 1300){
      viewWidth = "370px"
    }else if(window.innerWidth  < 1400){
      viewWidth = "450px"
    }
    return (
      <div>
        <div className="TopBar">
          <div style={{position: "absolute", display: page == "report" || page == "overview" ? "none" : "block", paddingTop: "20px"}}>
            <span style={{paddingLeft: "30px", color: "white"}}>{Locales.common.請選擇您欲查詢位置}：</span>
            <span className="SelectStore" onClick={this.handleOpenStoreModal} style={{maxWidth :viewWidth}}>
              <img src="../img/pos.svg" style={{width: "20px", height: "20px", margin: "0 5px 5px 0"}}></img>
              { this.getStoresLabel() }
            </span>
            <span className="SelectPos" style={{display: (page=="abnormal") ? "inline-block" : "none"}}>
              <MultiSelect
          		  options={options}
          		  selected={selected}
                onSelectedChanged={this.handleSelectedChanged.bind(this)}
                disabled={false}
                disableSearch={true}
                overrideStrings={{
                  selectSomeItems: Locales.common.請選擇部門地點,
                  allItemsAreSelected: Locales.common.所有部門地點,
                  selectAll: Locales.common.所有部門地點,
                  search: "Search",
                }}
              />
            </span>
          </div>
          <span className="UserInfo">
            <div style={{display: page == "overview" || page == "temp" || page == "sensor" ? "inline-block" : "none", paddingRight: "50px"}}>
              <img src="../img/refresh.png"
                   style={{width: "40px", height: "40px", marginRight: "15px", cursor: "pointer"}}
                   onClick={this.handleClickRefresh}></img>
              <span style={{display: this.state.lastUpdateTime == "" ? "none" : ""}}>
                {Locales.common.更新時間 + " " + moment(this.state.lastUpdateTime).format("HH:mm")}
              </span>
            </div>
            <div style={{display: "inline-block", cursor: "pointer"}} onClick={this.handleOpenUserModal}>
              <img src="../img/user.svg" style={{width: "40px", height: "40px", marginRight: "20px"}}></img>
              <span style={{marginRight: "10px"}}>{user.name}</span>
              <span className="Arrow"></span>
            </div>
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
            {checkSetting && <div style={{marginBottom: "10px", cursor: "pointer"}} onClick={this.handleClickBackendPage}>{Locales.common.後台}</div>}
            <div style={{cursor: "pointer"}} onClick={this.handleLogout}>{Locales.common.登出}</div>
          </Modal>
        </div>
      </div>
    );
  }
}

function mapStateToProps({ store, storeDepartment, page, language, token, user, updateData }, ownProps) {
  return { store, storeDepartment, page, language, token, user, updateData };
}


//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, { setStore, setStoreDepartment, setPageBackend, setUpdateData })(TopBar);
