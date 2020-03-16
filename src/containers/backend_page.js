import React, { Component } from "react";
import { connect } from "react-redux";
import { setStore, setStoreType, setStoreRegion, setStoreDepartment, setPageBackend, setToken, setUser ,setLanguage} from "../actions";
import { apiBranchList, apiUserInfo, apiIslogin, apiRoleAuthorityInfo, apiDefineList } from "../utils/api";
import { sortByKey, sortByHans, parseStoreType, setBranchOrder } from "../utils/common";
import { Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import TopBar from "../backend/top_bar";
import StoreSubpage from "../backend/store_subpage";
import FreezerSubpage from "../backend/freezer_subpage";
import SensorSubpage from "../backend/sensor_subpage";
import PermissionSubpage from "../backend/permission_subpage";
import UserSubpage from "../backend/user_subpage";
import TempAlertSubpage from "../backend/tempAlert_subpage";
import ElecAlertSubpage from "../backend/elecAlert_subpage";
import WatchedItemSubpage from "../backend/watchedItem_subpage";
import VendorSubpage from "../backend/vendor_subpage";
import CorrectionSubpage from "../components/correction_subpage";
import WatchScheduleSubpage from "../backend/watchSchedule_subpage";
import FreezerHistorySubpage from "../backend/freezerHistory_subpage";
import TransportSubpage from "../backend/transport_subpage";
import AbnormalLogSubpage from "../backend/abnormalLog_subpage";
import { withCookies, Cookies } from 'react-cookie';
import { Redirect } from "react-router-dom";
import { Locales } from "../lang/language";

class BackendPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      logout:false
    };

    const { cookies, token ,user} = this.props;
    const cookiesToke = token.user_id ? token :cookies.get('token');
    this.props.setToken(cookiesToke);
    let cookiesLanguage = cookies.get('language');
    if(!cookiesLanguage) cookiesLanguage = 'cht';
    this.props.setLanguage(cookiesLanguage)
    Locales.setLanguage(cookiesLanguage);
    apiIslogin(cookiesToke)
    .then(function (response) {
      if ( response.data.isLogin) {
        if (!user.user_id) {
          apiUserInfo({user_id: cookiesToke.user_id, token: cookiesToke})
          .then(function(response){
            let user = response.data.user;
            apiRoleAuthorityInfo({role_id: user.role_id, token: cookiesToke})
            .then(function(response){
              user.auth_info = response.data.role.auth_info;
              this.props.setUser(user);
              this.checkUserPermission(user);
              //this.props.setToken(cookiesToke);
            }.bind(this))
            .catch(function (error) {
              console.log(error);
            });
          }.bind(this))
          .catch(function (error) {
            console.log(error);
          });
        } else if ( user.auth_info.webpage ) {
          this.checkUserPermission(user);
        }
      } else {
        this.setState({logout:true});
      }
    }.bind(this))
    .catch(function (error) {
      this.setState({logout:true});
      console.log(error);
    }.bind(this));

    apiDefineList({type: "branch_order", token: cookiesToke})
    .then(function (response) {
      //console.log("branch_order define list, ", response);
      if(response.data.defines.length > 0) {
        setBranchOrder(response.data.defines[0].extension);
      }
      this.callAPIGetBranchList(cookiesToke);
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    }.bind(this));

    // get store type list
    //console.log("token, ", cookiesToke);
    apiDefineList({type: "branch_type", token: cookiesToke})
    .then(function (response) {
      //console.log("branch_type list, ", response.data);
      this.props.setStoreType(sortByKey(response.data.defines, "name"));
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    }.bind(this));

    // get region list
    apiDefineList({type: "region", token: cookiesToke})
    .then(function (response) {
      //console.log("region list, ", response.data);
      this.props.setStoreRegion(sortByKey(response.data.defines, "name"));
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });

    // get department list
    apiDefineList({type: "department", token: cookiesToke})
    .then(function (response) {
      //console.log("department list, ", response.data);
      this.props.setStoreDepartment(sortByKey(response.data.defines, "name"));
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  callAPIGetBranchList(cookiesToke) {
    apiBranchList(cookiesToke)
    .then(function (response) {
      var tmpBranchList = [], select = false;
      for(var i=0 ; i<response.data.branchs.length ; ++i) {
        if(response.data.branchs[i].status != 4) {
          response.data.branchs[i].select = false;
          tmpBranchList.push(response.data.branchs[i]);
        }
      }
      tmpBranchList = sortByHans(tmpBranchList, "branch_name")
      var storeTypeList = [];
      for(var i=0 ; i<tmpBranchList.length ; ++i) {
        if(tmpBranchList[i].type_name && !storeTypeList.includes(tmpBranchList[i].type_name)) {
          storeTypeList.push(tmpBranchList[i].type_name);
        }
      }
      storeTypeList = parseStoreType(storeTypeList);
      if(storeTypeList.length > 0) {
        for(var i=0 ; i<tmpBranchList.length ; ++i) {
          if(tmpBranchList[i].type_name == storeTypeList[0]) {
            tmpBranchList[i].select = true;
            break;
          }
        }
      }
      //this.props.setStore(sortByKey(tmpBranchList, "branch_name"));
      this.props.setStore(tmpBranchList);
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  checkUserPermission(user) {
    let checkSetting = user.auth_info.webpage.find(x=>(x.page_id =="Setting" && x.auth.indexOf("read") > -1)) ? true : false;
    let checkCalibration = user.auth_info.webpage.find(x=>(x.page_id == "CalibrationRecord" && x.auth.indexOf("read")> -1)) ? true : false;
    if (checkSetting) {
      this.props.setPageBackend("store");
    } else if (checkCalibration) {
      this.props.setPageBackend("correction");
    }
  }

  renderSub(){
    const {page_backend}=this.props;
    switch(page_backend) {
      case "store":
        return <StoreSubpage/>
      case "freezer":
        return <FreezerSubpage/>
      break;
      case "sensor":
        return <SensorSubpage/>
      break;
      case "permission":
        return <PermissionSubpage/>
      break;
      case "user":
        return <UserSubpage/>
      break;
      case "temp_alert":
        return <TempAlertSubpage/>
      break;
      case "elec_alert":
        return <ElecAlertSubpage/>
      break;
      case "abnormal_log":
        return <AbnormalLogSubpage/>
      break;
      case "vendor":
        return <VendorSubpage/>
      break;
      case "watch":
        return <WatchedItemSubpage/>
      break;
      case "transport":
        return <TransportSubpage/>
      break;
      case "correction":
        return <CorrectionSubpage/>
      break;
      case "freezer_history":
        return <FreezerHistorySubpage/>
      break;
      case "watch_schedule":
        return <WatchScheduleSubpage/>
      break;
    }
  }

  render() {
    if (this.state.logout) {
      return <Redirect to='/'/>;
    }
    const {page_backend,user}=this.props;
    let checkSetting = false;
    let checkCalibration = false;
    if(user.user_id && user.auth_info.webpage ){
      let settingAuth = user.auth_info.webpage.find(x=>(x.page_id =="Setting" && x.auth.indexOf("read") > -1));
      let calibrationAuth = user.auth_info.webpage.find(x=>(x.page_id == "CalibrationRecord" && x.auth.indexOf("read")> -1));
      checkSetting = settingAuth ? true:false;
      checkCalibration = calibrationAuth ? true:false;
    }
    return (
      <div className="MainPage">
        <div className="MainPageLogo"><div></div></div>
        <TopBar />
        <div className="MainMenu">
        {checkSetting && <div>
          <div className={page_backend=='store'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("store")}><a>{Locales.backend.門市}</a></div>
          <div className={page_backend=='freezer'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("freezer")}><a>{Locales.backend.冷凍櫃}</a></div>
          <div className={page_backend=='sensor'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("sensor")}><a>{Locales.backend.裝置}</a></div>
          <div className={page_backend=='permission'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("permission")}><a>{Locales.backend.角色與權限}</a></div>
          <div className={page_backend=='user'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("user")}><a>{Locales.backend.人員}</a></div>
          <div className={page_backend=='temp_alert'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("temp_alert")}><a>{Locales.backend.溫度警示}</a></div>
          <div className={page_backend=='elec_alert'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("elec_alert")}><a>{Locales.backend.電量警示}</a></div>
          <div className={page_backend=='abnormal_log'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("abnormal_log")}><a>{Locales.backend.異常紀錄相關}</a></div>
          <div className={page_backend=='watch'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("watch")}><a>{Locales.backend.巡檢品項}</a></div>
          {/*<div className={page_backend=='vendor'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("vendor")}><a>{Locales.backend.廠商資訊}</a></div>*/}
          <div className={page_backend=='transport'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("transport")}><a>{Locales.backend.運輸相關}</a></div>
          </div>}
        {checkCalibration && <div className={page_backend=='correction'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("correction")}><a>{Locales.backend.校正記錄}</a></div>}
        {checkSetting && <div>
          <div className={page_backend=='freezer_history'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("freezer_history")}><a>{Locales.backend.操作紀錄}</a></div>
          <div className={page_backend=='watch_schedule'?"SelectedItem":"Item"} onClick={()=>this.props.setPageBackend("watch_schedule")}><a>{Locales.backend.巡檢排程}</a></div>
        </div>}
        </div>
        <div className="BG">
          {this.renderSub()}
        </div>
      </div>
    );
  }
}

function mapStateToProps({ page_backend, token ,user}, ownProps) {
  return { page_backend, token ,user};
}


//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, { setStore, setStoreType, setStoreRegion, setStoreDepartment, setPageBackend, setToken, setUser,setLanguage})(withCookies(BackendPage));
