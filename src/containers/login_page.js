import React, { Component } from "react";
import { connect } from "react-redux";
import { setUser, setLanguage, setToken, setPageBackend } from "../actions";
import { Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import {
  apiLogin,
  apiUserInfo,
  apiRoleAuthorityInfo,
  apiIslogin,
  apiServerInfo
} from "../utils/api";
import { Redirect } from "react-router-dom";
import { Locales } from "../lang/language";
import { withCookies, Cookies } from "react-cookie";

class LoginPage extends Component {
  constructor(props) {
    super(props);
    const { cookies } = props;
    this.state = {
      email: cookies.get("email") || "",
      password: cookies.get("pasword") || "",
      email_error: "",
      password_error: "",
      apiVersion: ""
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    Locales.setLanguage(this.props.language);

    const cookiesToke = cookies.get("token");

    apiIslogin(cookiesToke)
      .then(
        function(response) {
          if (response.data.isLogin) {
            this.props.setPageBackend("store");
            this.props.setToken(cookiesToke);
            apiUserInfo({ user_id: cookiesToke.user_id, token: cookiesToke })
              .then(
                function(response) {
                  let user = response.data.user;
                  apiRoleAuthorityInfo({
                    role_id: user.role_id,
                    token: cookiesToke
                  })
                    .then(
                      function(response) {
                        user.auth_info = response.data.role.auth_info;
                        this.props.setUser(user);

                        let checkSetting = this.checkSettingAuth(user);
                        let checkMain = this.checkMainAut(user);
                        if (!checkSetting && !checkMain) {
                          this.clearCookies();
                        } else {
                          this.setState({ redirect: true });
                        }
                      }.bind(this)
                    )
                    .catch(function(error) {
                      console.log(error);
                    });
                }.bind(this)
              )
              .catch(function(error) {
                console.log(error);
              });
          } else {
          }
        }.bind(this)
      )
      .catch(function(error) {
        console.log(error);
      });
    apiServerInfo().then(
      function(response) {
        this.setState({ apiVersion: response.data });
      }.bind(this)
    );
  }
  componentWillReceiveProps(nextProps) {
    // console.log('Set Lang ',nextProps.language)

    Locales.setLanguage(nextProps.language);
  }
  handleSubmit(event) {
    const { email, password } = this.state;
    //console.log("set user : ", this.props.setUser(email));
    event.preventDefault();
    if (!this.validateForm()) {
      return;
    }
    var data = {
      username: email,
      password: password
    };
    apiLogin(data)
      .then(
        function(response) {
          if (response.data.status == 1) {
            let token = response.data.token;
            token.user_id = response.data.user_id;
            this.props.setToken(response.data.token);
            const { cookies } = this.props;
            cookies.set("email", email, { path: "/" });
            cookies.set("password", password, { path: "/" });
            const languageArr = ['cht','en'];
            let language = this.props.language;
            if(languageArr.indexOf(this.props.language) < 0){
              language ='cht';
            }
            cookies.set("language", language, { path: "/" });
            cookies.set("token", token, { path: "/" });
            const obj = this;
            this.getUserData(token.user_id, token, function() {
              obj.setState({ redirect: true });
            });
            /*} else if (response.data.code==1 ){
        this.setState({ email_error:"無此帳號"})*/
          } else {
            this.setState({ password_error: Locales.login.帳號密碼錯誤 });
          }
        }.bind(this)
      )
      .catch(
        function(error) {
          console.log(error);
          this.setState({ password_error: Locales.login.無登入權限 });
        }.bind(this)
      );
  }
  getUserData(userID, token, callBack) {
    apiUserInfo({ user_id: userID, token: token })
      .then(
        function(response) {
          if (response.data.status) {
            let user = response.data.user;
            this.getUserRolAuthorityInfo(user, token, callBack);
          } else {
            this.setState({ password_error: Locales.login.無登入權限 });
            this.clearCookies();
          }
        }.bind(this)
      )
      .catch(
        function(error) {
          console.log(error);
          this.setState({ password_error: Locales.login.無登入權限 });
        }.bind(this)
      );
  }
  getUserRolAuthorityInfo(user, token, callBack) {
    apiRoleAuthorityInfo({ role_id: user.role_id, token: token })
      .then(
        function(response) {
          user.auth_info = response.data.role.auth_info;
          this.props.setUser(user);
          if (typeof callBack == "function") {
            callBack();
          }
        }.bind(this)
      )
      .catch(
        function(error) {
          console.log(error);
          this.setState({ password_error: Locales.login.無登入權限 });
        }.bind(this)
      );
  }
  validateForm() {
    const { email, password } = this.state;
    var error = { email_error: "", password_error: "" };
    var result = true;
    if (email.length < 1) {
      error.email_error = Locales.login.請輸入Email;
      result = false;
    }
    if (password.length < 1) {
      error.password_error = Locales.login.請輸入密碼;
      result = false;
    }
    this.setState(error);
    return result;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  };

  translatePassword(password) {
    let newPassword = "";
    for (let i = 0; i < password.length; ++i) {
      newPassword += "•";
    }
    return newPassword;
  }

  passwordChange(password) {
    console.log("change password, ", password);
    let realPassword = "",
      findnewPassword = false;
    for (let i = 0; i < password.length; ++i) {
      if (password[i] != "•") {
        findnewPassword = true;
        realPassword += password[i];
      } else {
        if (findnewPassword == false) {
          if (this.state.password[i]) {
            realPassword += this.state.password[i];
          }
        } else {
          let lastStringCount = password.length - i;
          realPassword += this.state.password.substr(
            this.state.password.length - lastStringCount
          );
          break;
        }
      }
    }
    this.setState({ password: realPassword }, function() {
      // console.log("password, ", this.state.password);
    });
  }
  clearCookies = () => {
    const { cookies } = this.props;
    cookies.set("token", "", { path: "/" });
  };
  checkSettingAuth = user => {
    let checkSetting = false;
    if (user.user_id && user.auth_info.webpage) {
      let settingAuth = user.auth_info.webpage.find(
        x =>
          (x.page_id == "Setting" && x.auth.indexOf("read") > -1) ||
          (x.page_id == "CalibrationRecord" && x.auth.indexOf("read") > -1)
      );
      checkSetting = settingAuth ? true : false;
    }
    return checkSetting;
  };
  checkMainAut = user => {
    let checkMain = false;
    if (user.user_id && user.auth_info.webpage) {
      let mainWebAuth = user.auth_info.webpage.find(
        x =>
          (x.page_id == "ReportExport" && x.auth.indexOf("read") > -1) ||
          (x.page_id == "WatchData" && x.auth.indexOf("read") > -1)
      );
      let mainOverviewAuth = user.auth_info.config_tool.find(
        x => x.page_id == "Web" && x.auth.indexOf("read") > -1
      );
      checkMain = mainWebAuth || mainOverviewAuth ? true : false;
    }
    return checkMain;
  };
  render() {
    const { language, user } = this.props;
    let errorMag = "";
    const viewWidth = window.innerWidth;

    const device = /android|mobile|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    ); //android|
    if (device && viewWidth < 768) {
      return (
        <div>
          <div className="LogoImage" />
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              margin: "0 auto",
              textAlign: "center"
            }}
          >
            {Locales.login.標題}{" "}
          </div>
          <div style={{ width: "100%", margin: "0 auto" }}>
            <div
              style={{ width: "90%", margin: "30px auto 10px auto", textAlign: "left",fontSize: "5vw" }}
            >
              <span>網頁版不適用手機檢視，請由下方連結下載行動冷鏈APP</span>
              
              <br />
              <span style={{fontSize:"4vw", display: "block", marginTop:"20px"}}>The web version is not available for mobile phone viewing, please
              download the cold chain mobile APP below</span>
              
            </div>
          </div>
          <div style={{margin: "50px auto"}} >
            <a href="itms-services://?action=download-manifest&url=https://support.ushop-plus.com/ccm/ios/coldchain.plist">
              <img
                src="../img/IOS APP BT_mobile.png"
                className="ISO"
                style={{ width: "70%", margin: "20px auto", display: "block" }}
              />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.advantech.coldchain">
              <img
                src="../img/Android APP BT_mobile.png"
                className="Android"
                style={{ width: "70%", margin: "20px auto", display: "block" }}
              />
            </a>
          </div>
          <div
            style={{
              fontSize: "1rem",
              bottom: "5px",
              position: "absolute",
              textAlign: "center",
              width: "calc( 100% - 30px )"
            }}
          >
            Copyright@ 2019 Carrefour. All Rights Reserved.
          </div>
        </div>
      );
    }
    if (this.state.redirect) {
      let checkSetting = this.checkSettingAuth(user);
      let checkMain = this.checkMainAut(user);
      if (checkMain && !checkSetting) {
        return <Redirect to="/main" />;
      } else if (checkSetting && !checkMain) {
        return <Redirect to="/backend" />;
      } else if (checkSetting && checkMain) {
        return <Redirect to="/home" />;
      }
      errorMag = Locales.login.無登入權限;
    }
    return (
      <div className="LoginPage">
        <div className="LoginPageBG" />
          <div
            style={{
              fontSize: "12px",
              color: "#FFFFFF",
              opacity: "0.7",
              position: "absolute",
              bottom: "5px",
              left: "5px",
              pointerEvents: "none"
            }}
          >
            <div>{`Web Version : ${VERSION} [${NAME}]`}</div>
            <div>{`API Version : ${this.state.apiVersion.version}[${
              this.state.apiVersion.cloud
            }]`}</div>
            <div>Copyright@ 2019 Carrefour. All Rights Reserved.</div>
          </div>
        <div className="LoginPageContent">
          <div className="LogoImage" />
          <div
            style={{ fontSize: "28px", fontWeight: "bold", margin: "0 auto" }}
          >
            {Locales.login.標題}{" "}
          </div>
          <br />
          <form onSubmit={this.handleSubmit}>
            <div
              style={{
                width: "360px",
                margin: "0 auto",
                borderBottom: "1px solid #E9E9F0"
              }}
            >
              <img src="../img/username.svg" className="LoginPageInputIcon" />
              <input
                className="LoginPageInput"
                type="text"
                placeholder={Locales.login.帳號}
                value={this.state.email}
                onChange={e => this.setState({ email: e.target.value })}
              />
            </div>
            <div className="LoginPageError">{this.state.email_error}</div>
            <div
              style={{
                width: "360px",
                margin: "0 auto",
                borderBottom: "1px solid #E9E9F0"
              }}
            >
              <img src="../img/password2.svg" className="LoginPageInputIcon" />
              <input
                className="LoginPageInput"
                type="password"
                autoComplete="off"
                placeholder={Locales.login.密碼}
                value={this.state.password}
                onChange={e => this.setState({ password: e.target.value })}
              />
            </div>
            <div className="LoginPageError">
              {this.state.password_error}
              {errorMag}
            </div>
            <div
              style={{
                width: "360px",
                margin: "0 auto",
                borderBottom: "1px solid #E9E9F0"
              }}
            >
              <img src="../img/language2.svg" className="LoginPageInputIcon" />
              <select
                className="LangSelector"
                defaultValue={language}
                onChange={e => this.props.setLanguage(e.target.value)}
              >
                <option value={"cht"}>{"繁體中文"}</option>
                <option value={"en"}>{"English"}</option>
              </select>
            </div>
            <input
              className="LoginPageSubmit"
              type="submit"
              value={Locales.login.登入}
            />
          </form>
          <div className="QRcodeArea">
            <div style={{ display: "inline-block", marginRight: "20px" }}>
              <img src="../img/IOS APP QR.png" className="QRcode" />
              <a href="itms-services://?action=download-manifest&url=https://support.ushop-plus.com/ccm/ios/coldchain.plist">
                <img
                  src="../img/IOS APP BT.png"
                  className="ISO"
                  style={{ width: "130px" }}
                />
              </a>
            </div>
            <div style={{ display: "inline-block", marginLeft: "20px" }}>
              <img src="../img/Android APP QR.png" className="QRcode" />
              <a href="https://play.google.com/store/apps/details?id=com.advantech.coldchain">
                <img
                  src="../img/Android APP BT.png"
                  className="Android"
                  style={{ width: "130px" }}
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps({ posts, language, user }, ownProps) {
  return { language, user };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(
  mapStateToProps,
  { setLanguage, setUser, setToken, setPageBackend }
)(withCookies(LoginPage));
