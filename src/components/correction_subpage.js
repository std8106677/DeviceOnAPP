import React, { Component } from "react";
import { connect } from "react-redux";
import {} from "../actions";
import { Button } from "react-bootstrap";
import Select from "react-select";
import filterFactory, {
  selectFilter,
  textFilter
} from "react-bootstrap-table2-filter";
import {CompTable} from "../components/comp_Table";
import DateRangePicker from "../components/comp_DateRangeFilter";
import SettingTemplateDialog from "../components/settingTemplate_dialog";
import {
  apiSensorList,
  apiSensorCalibrationAdd,
  apiSensorCalibrationListBySensors,
  apiSensorCalibrationConfirmBySensor,
  apiBranchList,toCancelApi
} from "../utils/api";
import ReactFileReader from "react-file-reader";
import Modal from "react-modal";
import moment from 'moment';
import {Locales} from '../lang/language';

Modal.setAppElement(document.querySelector(".container"));

class CorrectionSubpage extends Component {
  constructor(props) {
    super(props);
    this.dropdownItems = [
      { value: 1, label: Locales.correction.合格 },
      { value: 2, label: Locales.correction.已修正 },
      { value: 0, label: Locales.correction.損壞 }
    ];
    if(props.store.length){
      const store = props.store.find(s => s.select);
      this.getSensorListByBranch(store.branch_id, props.token);
    }else{
      this.getBranchList()
    }
    this.state = {
      showModal: false,
      allSensor: [],
      calibrateDatas: [],
      listData: [],
      checkData: false,
      errMsg:""
    };
  }
  componentWillUnmount(){
    toCancelApi();
  }

  componentWillReceiveProps(nextProps) {
    const oldStore = this.props.store.length > 0 ?this.props.store.find(s => s.select) :{};
    const newStore =nextProps.store.length > 0 ? nextProps.store.find(s => s.select):{};
    if (oldStore.branch_id !== newStore.branch_id) {
      this.getSensorListByBranch(newStore.branch_id, nextProps.token);
    }
  }
  handleFiles = files => {
    var reader = new FileReader();
    reader.onload = function(e) {
      // Use reader.result
      alert(reader.result);
    };
    reader.readAsText(files[0]);
  };

  handleOpenModal = () => {
    this.setState({ showModal: true });
    const { store } = this.props;
    var tmpStore = JSON.parse(JSON.stringify(store));
    this.setState({ store: tmpStore });
  };

  handleCloseModal = () => {
    this.setState({ showModal: false ,checkData:false});
  };
  handleConfirmModal = () => {
    const { calibrateDatas } = this.state;
    const token = this.props.token;
    const store = this.props.store.find(s => s.select);
    let errorFg = false;
    let index = 0;
    this.setState({ checkData: false });
    let processData = calibrateDatas.filter(
      data =>
        data.sensor_id !== "" &&
        data.qualified !== "" &&
        data.adjustment1 !== "" &&
        data.adjustment2 !== "" &&
        data.adjustment3 !== ""
    );

    calibrateDatas.forEach(data => {
      if (
        (data.adjustment1 !== "" &&
          (data.adjustment2 === "" ||
            data.adjustment3 === "" ||
            data.qualified === "")) ||
        (data.adjustment2 !== "" &&
          (data.adjustment1 === "" ||
            data.adjustment3 === "" ||
            data.qualified === "")) ||
        (data.adjustment3 !== "" &&
          (data.adjustment2 === "" ||
            data.adjustment1 === "" ||
            data.qualified === "")) ||
        (data.qualified !== "" &&
          (data.adjustment2 === "" ||
            data.adjustment1 === "" ||
            data.adjustment3 === ""))
      ) {
        errorFg = true;
      } else if (
        data.sensor_id !== "" &&
        data.qualified !== "" &&
        data.adjustment1 !== "" &&
        data.adjustment2 !== "" &&
        data.adjustment3 !== ""
      ) {
        const item = {
          sensor_id: data.sensor_id,
          adjustment: [data.adjustment1, data.adjustment2, data.adjustment3],
          qualified: data.qualified,
          descr: data.descr,
          token
        };
        apiSensorCalibrationAdd(item)
          .then(
            function(response) {
              if (response.data.status === 1) {
                index++;
                this.setSensorCalibrationConfirmBySensor(data.sensor_id, token);
                if (processData.length === index) {
                  this.getSensorListByBranch(store.branch_id, token);
                }
                data.qualified = "";
                data.adjustment1 = "";
                data.adjustment2 = "";
                data.adjustment3 = "";
                data.descr = "";
              } else {
                errorFg = true;
              }
            }.bind(this)
          )
          .catch(function(error) {
            errorFg = true;
            console.log(error);
          });
      }
      return data;
    });
    this.setState({ errMsg:"" });
    if (errorFg) {
      this.setState({ checkData: true });
    }else if (processData.length ==0){
      this.setState({ checkData: true,errMsg:Locales.common.請輸入必填欄位 });
    } else {
      this.setState({ showModal: false, calibrateDatas });
    }
  };

  handleResetNewData = () => {
    this.setState({
      showModal: false,
      NewData_type: {},
      NewData_pos: {},
      NewData_result: {},
      NewData_ID: "",
      NewData_Name: "",
      NewData_Temp1: "",
      NewData_Temp2: "",
      NewData_Temp3: "",
      NewData_Note: ""
    });
  };

  handleChangeNoteComplete = (index, e) => {
    let data = this.state.calibrateDatas;
    data[index].descr = e.target.value;
    this.setState({ calibrateDatas: data });
  };
  handleChangeQualifiedComplete = (index, e) => {
    let data = this.state.calibrateDatas;
    data[index].qualified = e.value;
    this.setState({ calibrateDatas: data });
  };
  handleChangeAdjustment1Complete = (index, e) => {
    let data = this.state.calibrateDatas;
    data[index].adjustment1 = e.target.value;
    this.setState({ calibrateDatas: data });
  };
  handleChangeAdjustment2Complete = (index, e) => {
    let data = this.state.calibrateDatas;
    data[index].adjustment2 = e.target.value;
    this.setState({ calibrateDatas: data });
  };
  handleChangeAdjustment3Complete = (index, e) => {
    let data = this.state.calibrateDatas;
    data[index].adjustment3 = e.target.value;
    this.setState({ calibrateDatas: data });
  };

  getBranchList = () => {
    const {token}=this.props;
    apiBranchList(token)
    .then(function (response) {
      this.props.setStore(sortByKey(response.data.branchs, "status", false, false, true));
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }
  setSensorCalibrationConfirmBySensor = (sensor_id, token) => {
    // Confirm Sensor Calibration  By Sensor
    apiSensorCalibrationConfirmBySensor({ sensor_id: sensor_id, token: token })
      .then(
        function(response) {
          const sensorDatas = response.data;
        }.bind(this)
      )
      .catch(function(error) {
        console.log(error);
      });
  };
  getSensorListByBranch = (branch_id, token) => {
    // get Sensor list By Branch
    apiSensorList({ branch_id: branch_id, token: token })
      .then(
        function(response) {
          const sensorDatas = response.data.sensors;
          let calibrateDatas = [];
          if (sensorDatas !== undefined && sensorDatas.length > 0) {
            calibrateDatas = sensorDatas.filter(x => x.status == "2");
            calibrateDatas.forEach(e => {
              e.adjustment1 = "";
              e.adjustment2 = "";
              e.adjustment3 = "";
              e.qualified = "";
              e.descr = "";
            });
          }
          this.setState({ allSensor: sensorDatas, calibrateDatas });
          this.getSensorCalibrationListBySensors();
        }.bind(this)
      )
      .catch(function(error) {
        console.log(error);
      });
  };
  getSensorCalibrationListBySensors = () => {
    const { token } = this.props;
    const allSensor = this.state.allSensor;
    const allSensorID = allSensor.map(x => x.sensor_id);
    const qualifiedArr = this.dropdownItems;
    // get SensorCalibration list
    apiSensorCalibrationListBySensors({ token, sensor_ids: allSensorID })
      .then(
        function(response) {
          let result = [];
          if (
            response.data.sensors_calibration !== undefined &&
            response.data.sensors_calibration.length > 0
          ) {
            response.data.sensors_calibration.forEach(function(s) {
              if (s.calibrations !== undefined && s.calibrations.length > 0) {
                s.calibrations.forEach(function(c) {
                  let tempSensor = allSensor.find(
                    x => x.sensor_id == s.sensor_id
                  );
                  // var options_type = [
                  //   { value: "一般", label: "一般" },
                  //   { value: "車載", label: "車載" }
                  // ];
                  // let qualified_label = "";
                  // if (
                  //   qualifiedArr.map(x => x.value).indexOf(c.qualified) > -1
                  // ) {
                  //   qualified_label = qualifiedArr.find(
                  //     x => x.value == c.qualified
                  //   ).label;
                  // }
                  result.push({
                    calibration_id: c.calibration_id,
                    sensor_id: s.sensor_id,
                    sensor_name: tempSensor.name,
                    sensor_type: tempSensor.sensor_type,
                    adjustment: c.adjustment,
                    qualified: c.qualified,
                    // qualified_label: qualified_label,
                    date: c.date,
                    descr: c.descr
                  });
                });
              }
            });
          }
          this.setState({ listData: result });
        }.bind(this)
      )
      .catch(function(error) {
        console.log(error);
      });
  };
  dateFormatter=(cell, row)=>{
    return moment(cell).format("YYYY/MM/DD HH:mm")
  }
  render() {
    const { store, searchfilter } = this.props;
    const { listData, checkData,errMsg } = this.state;
    var options_pos = [
      { value: "fixed", label: Locales.sensorType.Fixed },
      { value: "mobile", label: Locales.sensorType.Mobile }
    ];
    const searchFrom =  moment(searchfilter.From ).format("YYYY-MM-DD HH:mm")
    const searchTo =  moment(searchfilter.To ).format("YYYY-MM-DD HH:mm:ss")
    let resultData = listData.filter(function(x) {
      return (
        searchFrom <= x.date &&
        searchTo >= x.date &&
        searchfilter.Filter.indexOf(x.qualified) > -1
      );
    });
    const qualifiedStateList =this.dropdownItems;
    let  viewWidth = window.innerWidth - 370;
    const columns = [
      {
        dataField: "sensor_type",
        text: Locales.correction.裝置類型,
        sort: true,
        formatter: cell => options_pos.find(opt => opt.value == cell)
        ? options_pos.find(opt => opt.value == cell).label
        : cell,
        filter: selectFilter({
          options: options_pos
        }),
        headerStyle: () => {
          return {
            width: `${viewWidth*10/100}px`
          };
        },
        style: {
          width: `${viewWidth*10/100}px`
        }
      },
      {
        dataField: "sensor_id",
        text: Locales.correction.裝置ID,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*20/100}px`
          };
        },
        style: {
          width: `${viewWidth*20/100}px`,
          wordWrap: "break-word"
        }
      },
      {
        dataField: "sensor_name",
        text: Locales.correction.裝置名稱,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*20/100}px`
          };
        },
        style: {
          width: `${viewWidth*20/100}px`,
          wordWrap: "break-word"
        }
      },
      {
        dataField: "adjustment[0]",
        text: Locales.correction.校正溫度,
        headerAttrs: (column, colIndex) => ({ 'colSpan': 3 }),
        headerStyle: () => {
          return {
            width: `${viewWidth*13.5/100}px`
          };
        },
        style: {
          width: `${viewWidth*4/100}px`
        }
      },
      {
        dataField: "adjustment[1]",
        text: Locales.correction.校正溫度,
        headerStyle: () => {
          return {
            display: "none"
          };
        },
        style: {
          width: `${viewWidth*4/100}px`
        }
      },
      {
        dataField: "adjustment[2]",
        text: Locales.correction.校正溫度,
        headerStyle: () => {
          return {
            display: "none"
          };
        },
        style: {
          width: `${viewWidth*4/100}px`
        }
      },
      {
        dataField: "qualified",
        text: Locales.common.結果,
        sort: true,
        formatter: cell => qualifiedStateList.find(opt => opt.value == cell)
        ? qualifiedStateList.find(opt => opt.value == cell).label
        : cell,
        filter: selectFilter({
          options:  qualifiedStateList
        }),
        headerStyle: () => {
          return {
            width: `${viewWidth*9.5/100}px`
          };
        },
        style: {
          width: `${viewWidth*9.5/100}px`,
          textAlign:"center"
        }
      },
      {
        dataField: "date",
        text: Locales.correction.最後更新時間,
        sort: true,
        formatter:this.dateFormatter,
        headerStyle: () => {
          return {
            width: `${viewWidth*17/100}px`
          };
        },
        style: {
          width: `${viewWidth*17/100}px`
        }
      },
      {
        dataField: "descr",
        text: Locales.correction.備註,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*10/100+25}px`
          };
        },
        style: {
          width: `${viewWidth*10/100}px`
        }
      }
    ];

    const defaultSorted =[{
      dataField: 'sensor_name', // if dataField is not match to any column you defined, it will be ignored.
      order: 'asc' // desc or asc
    }];
    var height = window.innerHeight - 260 + "px";
    return (
      <div className="Subpage">
        <DateRangePicker
          dropdownItems={this.dropdownItems}
          selectedItems={this.dropdownItems.map(x => x.value)}
        />
        {/* <br /> */}
        <div className="CorrectSubpage">
          {/* <ReactFileReader handleFiles={this.handleFiles} fileTypes={".csv"}>
            <Button
              style={{
                width: "120px",
                margin: "20px 20px 0 0",
                boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.2)"
              }}
            >
              匯入
            </Button>
          </ReactFileReader> */}
          <Button
            onClick={this.handleOpenModal}
            style={{
              width: "120px",
              margin: "20px 0 0 0",
              boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.2)"
            }}
            disabled={this.state.calibrateDatas.length === 0}
          >
            {Locales.common.新增}
          </Button>
          {this.state.calibrateDatas.length === 0 && <span style={{verticalAlign: "bottom"}}>{Locales.correction.目前無需校正裝置}</span>}
          <SettingTemplateDialog
            isOpen={this.state.showModal}
            modalTitle={Locales.common.新增}
            cancelCB={this.handleCloseModal}
            confirmCB={this.handleConfirmModal}
            shouldCloseOnOverlayClick={true}
            contentLabel="Minimal Modal Example"
            width="960px"
            height="640px"
          >
            <table width="100%" className="CorrectSubpageTable">
              <thead>
                <tr>
                  <th style={{ width: "200px" }}>{Locales.correction.裝置名稱}</th>
                  <th style={{ width: "200px" }}>{Locales.correction.裝置ID}</th>
                  <th style={{ width: "200px" }}>{Locales.correction.校正溫度}<label className="required">*</label></th>
                  <th style={{ width: "110px" }}>{Locales.common.結果}<label className="required">*</label></th>
                  <th>{Locales.correction.備註}</th>
                </tr>
              </thead>
              <tbody>
                {this.state.calibrateDatas.map((item, index) => {
                  let adj1Cln = "";
                  let adj2Cln = "";
                  let adj3Cln = "";
                  let qualifiedCln = "";
                  if(( item.adjustment1 != "") ||( item.adjustment2 != "") || ( item.adjustment3 != "") || item.qualified!= "")
                  {if (
                   isNaN(item.adjustment1) || (item.adjustment1 == "" &&
                    checkData)
                  ) {
                    adj1Cln = "error";
                  }
                  if (
                    isNaN(item.adjustment2) ||( item.adjustment2 == "" &&
                    checkData)
                  ) {
                    adj2Cln = "error";
                  }
                  if (
                    isNaN(item.adjustment3) ||( item.adjustment3 == "" &&
                    checkData)
                  ) {
                    adj3Cln = "error";
                  }
                  if (!Number.isInteger(item.qualified) && checkData) {
                    qualifiedCln = "error";
                  }}
                  return (
                    <tr key={item.sensor_id}>
                      <td>{item.name} </td>
                      <td>{item.sensor_id} </td>
                      <td>
                        <input
                          type="text"
                          className={"InputStyle " + adj1Cln}
                          style={{ width: "30%", display: "inline-block" }}
                          value={item.adjustment1}
                          onChange={this.handleChangeAdjustment1Complete.bind(
                            this,
                            index
                          )}
                        />
                        &nbsp;
                        <input
                          type="text"
                          className={"InputStyle " + adj2Cln}
                          style={{ width: "30%", display: "inline-block" }}
                          value={item.adjustment2}
                          onChange={this.handleChangeAdjustment2Complete.bind(
                            this,
                            index
                          )}
                        />
                        &nbsp;
                        <input
                          type="text"
                          className={"InputStyle " + adj3Cln}
                          style={{ width: "30%", display: "inline-block" }}
                          value={item.adjustment3}
                          onChange={this.handleChangeAdjustment3Complete.bind(
                            this,
                            index
                          )}
                        />
                      </td>
                      <td>
                        <Select
                          className={qualifiedCln}
                          options={this.dropdownItems}
                          placeholder={Locales.common.請選擇}
                          value={this.dropdownItems.find(
                            option => option.value === item.qualified
                          )}
                          onChange={this.handleChangeQualifiedComplete.bind(
                            this,
                            index
                          )}
                          style={{ width: "200px" }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="InputStyle"
                          value={item.descr}
                          onChange={this.handleChangeNoteComplete.bind(
                            this,
                            index
                          )}
                        />
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan="5" style={{color: "red"}}>{errMsg}</td>
                </tr>
              </tbody>
            </table>
          </SettingTemplateDialog>
          {/* <br /> */}
          <br />
            <div style={{ paddingTop: "10px", height: height, overflow: "auto" }}>

              <CompTable
                keyField="calibration_id"
                data={resultData}
                columns={columns}
                defaultSorted={defaultSorted}
              />
            </div>

        </div>
      </div>
    );
  }
}

function renderCorrectionList(correctionlist) {
  return _.map(correctionlist, correction => {
    return (
      <tr key={correction.calibration_id} className="rowDataContent">
        <td>{correction.sensor_type}</td>
        <td>{correction.sensor_id}</td>
        <td>{correction.sensor_name}</td>
        <td>{correction.adjustment[0]}</td>
        <td>{correction.adjustment[1]}</td>
        <td>{correction.adjustment[2]}</td>
        <td>{correction.qualified_label}</td>
        <td>{correction.date}</td>
        <td style={{ textAlign: "left" }}>{correction.descr}</td>
      </tr>
    );
  });
}

function mapStateToProps({ store, searchfilter, token }, ownProps) {
  return { store, searchfilter, token };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(
  mapStateToProps,
  {}
)(CorrectionSubpage);
