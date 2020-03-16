import React, { Component } from "react";
import { connect } from "react-redux";
import { setPage, setPageBackend ,setUser,setToken,setLanguage} from "../actions";
import { Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import { Row, Col } from 'reactstrap';
import { apiLogout,apiIslogin,apiUserInfo,apiRoleAuthorityInfo   } from "../utils/api";
import { Redirect } from "react-router-dom";
import Modal from 'react-modal';
import { Locales } from "../lang/language";
import { withCookies, Cookies } from 'react-cookie';

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

class HomePage extends Component {
  constructor(props) {
    super(props);
    const { cookies, token ,user} = this.props;
    const cookiesToke = cookies.get('token');
    this.state = {
      redirectMainPage: false,
      redirectBackendPage: false,
      showUserModal: false,
      logout: false,
      cookiesToke:cookiesToke,
      userInfo:user
    };
    let cookiesLanguage = cookies.get('language');
    if(!cookiesLanguage) cookiesLanguage = 'cht';
    this.props.setLanguage(cookiesLanguage)
    Locales.setLanguage(cookiesLanguage);
    if(!token.token_id && cookiesToke &&cookiesToke.token_id){
      this.props.setToken(cookiesToke);
    }
    this.checkToken()

  }

  handleClickMainPage = () => {
    this.checkToken("main")
  }

  handleClickBackendPage = () => {
    this.checkToken("backend")
  }
  checkToken = (type) => {
    const {token,user} = this.props;
    const{cookiesToke,userInfo} =this.state
    apiIslogin(cookiesToke)
    .then(function (response) {
      if (response.data.isLogin) {      
        if (!userInfo.user_id) {
          apiUserInfo({user_id: cookiesToke.user_id, token: cookiesToke})
          .then(function(response){
            if(response.data.status){
              let user = response.data.user;
              apiRoleAuthorityInfo({role_id: user.role_id, token: cookiesToke})
              .then(function(response){
                user.auth_info = response.data.role.auth_info;
                this.props.setUser(user);
                this.setState({userInfo:user})
              }.bind(this))
              .catch(function (error) {
                console.log(error);
              });
            }
           
          }.bind(this))
          .catch(function (error) {
            console.log(error);
          });
        } 
        



        if (userInfo.user_id) {
          if (type === "main") {
            this.setState({redirectMainPage: true});
          } else if (type === "backend") {
            this.setState({redirectBackendPage: true});
            this.props.setPageBackend("store");
          }
        } 
      } else {
        this.setState({logout:true});
      }
    }.bind(this))
    .catch(function (error) {
      this.setState({logout:true});
      console.log(error);
    }.bind(this));
  }
  handleOpenUserModal = () => {
    this.setState({showUserModal: true});
  }

  handleCloseUserModal = () => {
    this.setState({showUserModal: false});
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

  render() {
    if (this.state.redirectMainPage){
      return <Redirect to='/main'/>;
    } else if (this.state.redirectBackendPage) {
      return <Redirect to='/backend'/>;
    } else if (this.state.logout) {
      return <Redirect to='/'/>;
    }
    const {user} = this.props;
    const { userInfo} = this.state;
    let checkSetting = false;
    if(userInfo.user_id && userInfo.auth_info.webpage ){
      let settingAuth = userInfo.auth_info.webpage.find(x=>(x.page_id =="Setting" && x.auth.indexOf("read") > -1) ||( x.page_id == "CalibrationRecord" && x.auth.indexOf("read")> -1));
      checkSetting = settingAuth ? true:false;
    }
    let checkMain = false;
    if(userInfo.user_id && userInfo.auth_info.webpage ){
      let mainWebAuth = userInfo.auth_info.webpage.find(x=>(x.page_id =="ReportExport" && x.auth.indexOf("read") > -1) ||(x.page_id =="WatchData" && x.auth.indexOf("read") > -1));
      let mainOverviewAuth = userInfo.auth_info.config_tool.find(x=>(x.page_id =="Web" && x.auth.indexOf("read") > -1));
      checkMain = (mainWebAuth || mainOverviewAuth) ? true:false;
    }
    if(userInfo.user_id && userInfo.auth_info.webpage ){
      if(checkMain && !checkSetting){
        return <Redirect to='/main'/>;
      }else if(checkSetting && !checkMain){
        return <Redirect to='/backend'/>;
      }else if(!checkSetting && !checkMain){
        return <Redirect to='/'/>;
      }
    }
    return (
      <div className="HomePage">
        <div>
          <div className="TopBar" style={{left: "0px", width: "100%"}}>
            <span className="UserInfo" onClick={this.handleOpenUserModal}>
              <img src="../img/user.svg" style={{width: "40px", height: "40px", marginRight: "20px"}}></img>
              <span style={{marginRight: "10px"}}>{user.name}</span>
              <span className="Arrow"></span>
            </span>
            <Modal
              isOpen={this.state.showUserModal}
              style={userModalStyles}
              onRequestClose={this.handleCloseUserModal}
              shouldCloseOnOverlayClick={true}
              contentLabel="">
              <span style={{padding: "10px 50px 10px 0", cursor: "pointer"}} onClick={this.handleLogout}>{Locales.common.登出}</span>
            </Modal>
          </div>
        </div>
        <div style={{marginTop: "200px"}}>
          <Row style={{margin: "0px"}}>
            {checkMain && <Col lg={6} md={6} sm={12}>
              <div className="HomePageBtn" onClick={this.handleClickMainPage}>
                <img src="../img/homeBtn1.png" />
                <span>{Locales.common.雲端冷鏈}</span>
              </div>
            </Col>}
            {checkSetting&& <Col lg={6} md={6} sm={12}>
              <div className="HomePageBtn" onClick={this.handleClickBackendPage}>
                <img src="../img/homeBtn2.png" />
                <span>{Locales.common.設定}</span>
              </div>
            </Col>}
          </Row>
        </div>
      </div>
    );
  }
}

function mapStateToProps({ token,user }, ownProps) {
  return { token,user };
}


//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, { setPage, setPageBackend,setUser,setToken,setLanguage })(withCookies(HomePage));
