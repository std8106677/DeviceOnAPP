import React, { Component } from "react";
import { connect } from "react-redux";
import { setPage, setSensor, setStore, setStoreDepartment, setTemp,setToken,setUser ,setLanguage} from "../actions";
import { Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { apiBranchList, apiDefineList ,apiIslogin,apiUserInfo,apiRoleAuthorityInfo} from "../utils/api";
import { sortByKey, sortByHans, parseStoreType, setBranchOrder } from "../utils/common";
import SensorSubpage  from "../components/sensor_subpage";
import TempSubpage from "../components/temp_subpage";
import AbnormalSubpage from "../components/abnormal_subpage";
import WatchSubpage from "../components/watch_subpage";
import GoodsSubpage from "../components/goods_subpage";
import TransportSubpage from "../components/transport_subpage";
import ReportSubpage from "../components/report_subpage";
import CorrectionSubpage from "../components/correction_subpage";
import OverviewSubpage from "../components/overview_subpage";
import TopBar from "../components/top_bar";
import { withCookies, Cookies } from 'react-cookie';
import { Redirect } from "react-router-dom";
import { Locales } from "../lang/language";
class MainPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      logout:false
    };
    //const {page, sensor, temp}=this.props;
    //console.log('init main');

    const { cookies ,token,user,page,language} = this.props;
    //console.log(page,language)
    const cookiesToke = cookies.get('token');
    let cookiesLanguage = cookies.get('language');
    if(!cookiesLanguage) cookiesLanguage = 'cht';
    this.props.setLanguage(cookiesLanguage)
    Locales.setLanguage(cookiesLanguage);
    apiIslogin(cookiesToke)
    .then(function (response) {
      if ( response.data.isLogin ) {
        if(!token.token_id){
          this.props.setToken(cookiesToke);
        }
        if(!user.user_id){
          apiUserInfo({user_id:cookiesToke.user_id,token:cookiesToke})
          .then(function(response){
            let user = response.data.user;
              apiRoleAuthorityInfo({role_id:user.role_id,token:cookiesToke})
              .then(function(response){
                user.auth_info =response.data.role.auth_info;
                this.props.setUser(user);
                this.checkUserPermission(user);
              }.bind(this))
              .catch(function (error) {
                console.log(error);
              });
          }.bind(this))
          .catch(function (error) {
            console.log(error);
          });
        } else {
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

    // get department list
    apiDefineList({type: "department", token: cookiesToke})
    .then(function (response) {
      //console.log("region list, ", response.data);
      if(response.data.defines) {
        for(var i=0 ; i<response.data.defines.length ; ++i) {
          response.data.defines[i].select = true;
        }
        this.props.setStoreDepartment(sortByKey(response.data.defines, "name"));
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }

  callAPIGetBranchList(cookiesToke) {
    apiBranchList(cookiesToke)
    .then(function (response) {
      var tmpBranchList = [];
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
    let checkOverview = false;
    if(user.user_id && user.auth_info.config_tool) {
      let overviewAuth = user.auth_info.config_tool.find(x=>(x.page_id =="Web" && x.auth.indexOf("read") > -1));
      checkOverview = overviewAuth ? true:false;
    }
    if(checkOverview) {
      this.props.setPage("overview");
    } else {
      this.props.setPage("temp");
    }
  }

  renderSub(){
    const {page}=this.props;
    switch(page) {
      case "overview":
        return <OverviewSubpage/>
      break;
      case "temp":
        return <TempSubpage/>
      break;
      case "sensor":
        return <SensorSubpage />
      break;
      case "abnormal":
        return <AbnormalSubpage/>
      break;
      case "watch":
        return <WatchSubpage/>
        break;
      break;
      case "good":
        return <GoodsSubpage/>
        break;
      case "transport":
        return <TransportSubpage/>
        break;
      case "correction":
        return <CorrectionSubpage/>
      break;
      case "report":
        return <ReportSubpage/>
      break;
    }
  }

  render() {
    if (this.state.logout) {
      return <Redirect to='/'/>;
    }
    const {page,user}=this.props;


    let checkOverview = false;
    let checkWatchData = false;
    let checkReport = false;
    if(user.user_id && user.auth_info.webpage ){
      let reportAuth = user.auth_info.webpage.find(x=>(x.page_id =="ReportExport" && x.auth.indexOf("read") > -1) );
      let watchDataAuth = user.auth_info.webpage.find(x=>(x.page_id =="WatchData" && x.auth.indexOf("read") > -1));
      let overviewAuth = user.auth_info.config_tool.find(x=>(x.page_id =="Web" && x.auth.indexOf("read") > -1));
      checkOverview = overviewAuth ? true:false;
      checkWatchData = watchDataAuth ? true:false;
      checkReport = reportAuth ? true:false;
    }
    return (
      <div className="MainPage">
        <div className="MainPageLogo"><div></div></div>
        <TopBar />
        <div className="MainMenu">
          {checkOverview &&<div className={page=='overview'?"SelectedItem":"Item"} onClick={()=>this.props.setPage("overview")}><a><img src="../img/menu_overview.svg"></img>{Locales.main.Overview}</a></div>}
          {checkWatchData && <div>
          <div className={page=='temp'?"SelectedItem":"Item"} onClick={()=>this.props.setPage("temp")}><a><img src="../img/menu_temp.svg"></img>{Locales.main.溫度監測}</a></div>
          <div className={page=='sensor'?"SelectedItem":"Item"} onClick={()=>this.props.setPage("sensor")}><a><img src="../img/menu_sensor.svg"></img>{Locales.main.裝置監測}</a></div>
          <div className={page=='abnormal'?"SelectedItem":"Item"} onClick={()=>this.props.setPage("abnormal")}><a><img src="../img/menu_abnormal.svg"></img>{Locales.main.異常狀態}</a></div>
          <div className={page=='watch'?"SelectedItem":"Item"} onClick={()=>this.props.setPage("watch")}><a><img src="../img/menu_watch.svg"></img>{Locales.main.巡檢紀錄}</a></div>
          <div className={page=='good'?"SelectedItem":"Item"} onClick={()=>this.props.setPage("good")}><a><img src="../img/menu_good.svg"></img>{Locales.main.收貨紀錄}</a></div>
          <div className={page=='transport'?"SelectedItem":"Item"} onClick={()=>this.props.setPage("transport")}><a><img src="../img/menu_transport.svg"></img>{Locales.main.運輸紀錄}</a></div>
          </div>}
          {checkReport &&<div className={page=='report'?"SelectedItem":"Item"} onClick={()=>this.props.setPage("report")}><a><img src="../img/menu_report.svg"></img>{Locales.main.匯出報表}</a></div>}
        </div>
        <div className="BG">
          {this.renderSub()}
        </div>
      </div>
    );
  }
}

function mapStateToProps({ page, sensor, store, temp, token ,user,language}, ownProps) {
  return { page, sensor, store, temp, token ,user,language};
}


//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, { setPage, setSensor, setStore, setStoreDepartment, setTemp,setToken,setUser,setLanguage })(withCookies(MainPage));
