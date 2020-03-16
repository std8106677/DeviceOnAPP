import React, { Component } from "react";
import { connect } from "react-redux";
import {} from "../actions";
import { Button } from "react-bootstrap";
import moment from "moment";
import Select from "react-select";
import DayPickerInput from "react-day-picker/DayPickerInput";
import { formatDate, parseDate } from "react-day-picker/moment";
import SettingTemplateDialog from "../components/settingTemplate_dialog";
import ConfirmDialog from '../components/confirm_dialog';
import { Locales } from "../lang/language";
import { apiFreezerList, apiScheduleList, apiScheduleAdd, apiScheduleInfo,
         apiScheduleUpdate, apiScheduleDelete, toCancelApi, apiRuleTemplateList } from "../utils/api";
import $ from "jquery";
import {  sortByKey } from "../utils/common";

const WeekList = [
  { value: "1", label: Locales.weekList.星期一 },
  { value: "2", label: Locales.weekList.星期二 },
  { value: "3", label: Locales.weekList.星期三 },
  { value: "4", label: Locales.weekList.星期四 },
  { value: "5", label: Locales.weekList.星期五 },
  { value: "6", label: Locales.weekList.星期六 },
  { value: "7", label: Locales.weekList.星期日 }
];

class WatchScheduleSubpage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      selectedItem: {},
      alertContent: "",
      freezerList: [],
      scheduleList: [],
      rule_template_ids: [""],
      store: this.props.store.find(s => s.select)
    };
    const { token } = this.props;
    this.getScheduleList(this.state.store.branch_id, token);
    this.getFreezerDataByStore(this.state.store.branch_id, token);
    this.setDefaultRuleTemplateID();
  }

  componentWillUnmount() {
    toCancelApi();
  }

  componentWillReceiveProps(nextProps) {
    const oldStore = this.props.store.find(s => s.select);
    const newStore = nextProps.store.find(s => s.select);
    if (oldStore.branch_id !== newStore.branch_id) {
      this.getScheduleList(newStore.branch_id, nextProps.token);
      this.getFreezerDataByStore(newStore.branch_id, nextProps.token);
      this.setState({ store: newStore });
    }
  }

  setDefaultRuleTemplateID = () => {
    const {token} = this.props;
    // get Role Template  list
    apiRuleTemplateList({acc_id: this.props.user.acc_id, token})
    .then(function(response) {
      const ruleTemplateData = response.data.rule_templates.filter(x=> x.alert_rule_id.indexOf("sys_") == -1 && x.name.indexOf("Inspection Custom") > -1);
      this.setState({
        rule_template_ids:ruleTemplateData.map(x=> x.rule_template_id)
      });
    }.bind(this))
    .catch(function(error) {
      // console.log(error);
    });
  }

  getFreezerDataByStore(branch_id, token) {
    var data = { branch_id, token };
    apiFreezerList(data)
    .then(function(response) {
      let freezerList = response.data.freezers.filter(x=>x.type_id == "table" && x.status != 4);
      if (response) this.setState({ freezerList: freezerList });
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  getScheduleList = (branch_id, token) => {
    apiScheduleList({ token, branch_id })
    .then(function(response) {
      let result = [];
      if(response.data.branch_tasks && response.data.branch_tasks.length > 0){
        response.data.branch_tasks.forEach(t => {
          result = result.concat(t.tasks);
        });
      }
      this.setState({scheduleList: result});
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  getScheduleInfo = task_id => {
    const { token } = this.props;
    apiScheduleInfo({ token, task_id })
    .then(function(response) {
      let result = response.data.task ;
      if(result.schedule.start_date) {
        result.schedule.start_date = moment(result.schedule.start_date).format("YYYY/MM/DD");
      }
      if(result.schedule.end_date) {
        result.schedule.end_date = moment(result.schedule.end_date).format("YYYY/MM/DD");
      }
      this.setState({
        showModal: true,
        selectedItem: result
      });
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  getScheduleDelete = task_id => {
    const { token } = this.props;
    const { store } = this.state;
    apiScheduleDelete({ token, task_id })
    .then(function(response) {
      this.getScheduleList(store.branch_id, token);
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  };

  setScheduleAdd = task => {
    const { token } = this.props;
    const { store, rule_template_ids } = this.state;
    if (task.branch_id != store.branch_id){
      task.branch_id = store.branch_id
    }
    task.rule_template_ids = rule_template_ids;
    if(task.schedule.start_date) {
      task.schedule.start_date = moment(task.schedule.start_date).format("YYYY-MM-DD");
    }
    if(task.schedule.end_date) {
      task.schedule.end_date = moment(task.schedule.end_date).format("YYYY-MM-DD");
    }
    // console.log(task)
    apiScheduleAdd({ token, task })
    .then(function(response) {
      this.getScheduleList(store.branch_id, token);
      this.handleCloseModal();
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  setScheduleUpdate = task => {
    const { token } = this.props;
    const { store, rule_template_ids } = this.state;
    task.rule_template_ids = rule_template_ids;
    if(task.schedule.start_date) {
      task.schedule.start_date = moment(task.schedule.start_date).format("YYYY-MM-DD");
    }
    if(task.schedule.end_date) {
      task.schedule.end_date = moment(task.schedule.end_date).format("YYYY-MM-DD");
    }
    apiScheduleUpdate({ token, task })
    .then(function(response) {
      this.getScheduleList(store.branch_id, token);
      this.handleCloseModal();
    }.bind(this))
    .catch(function(error) {
      console.log(error);
    });
  }

  handleDeleteModal = selectedItem => {
    let freezer = this.state.freezerList.find(x=>x.freezer_id ==selectedItem.freezer_id);
    let freezerName = "";
    if(freezer) {
      freezerName = freezer.name;
    }
    this.setState({ showConfirmModal: true, selectedItem, alertContent: Locales.watch.確定刪除任務嗎.format("["+freezerName+"]") });
  }

  handleOpenModal = selectedItem => {
    if (selectedItem.task_id) {
      this.getScheduleInfo(selectedItem.task_id);
    } else {
      this.setState({ selectedItem: undefined, showModal: true });
    }
  }

  handleCloseModal = () => {
    this.setState({ showModal: false, selectedItem: undefined});
  }

  handleChangeFreezerComplete = () => {
    this.setState({ showModal: false });
  }

  handleconfirmModal = data => {
    if (data.task_id) {
      this.setScheduleUpdate(data);
    } else {
      this.setScheduleAdd(data);
    }
  }

  handleCloseConfirmModal = () => {
    this.setState({ showConfirmModal: false,alertContent:"" });
  }

  handelConfirmDeleted = () => {
    let selectedItem = this.state.selectedItem;
    if (selectedItem) {
      this.getScheduleDelete(selectedItem.task_id);
    }
    this.setState({showConfirmModal: false, alertContent: "" });
  }

  renderConfirmDialog() {
    if(this.state.showConfirmModal) {
      return (
        <div onClick={e=>e.stopPropagation()}>
          <ConfirmDialog
            content={this.state.alertContent}
            confirmCB={this.handelConfirmDeleted}
            cancelCB={this.handleCloseConfirmModal}
          />
        </div>
      );
    }
  }

  render() {
    var height = window.innerHeight - 220 + "px";
    let viewWidth = window.innerWidth - 440;
    return (
      <div className="Subpage">
      { this.renderConfirmDialog() }
        <div className="WhiteBGSubpage">
          <div style={{ paddingTop: "20px" }}>
            <Button onClick={this.handleOpenModal}>{Locales.watch.新增任務}</Button>
            <AddScheduleModal
              showModal={this.state.showModal}
              handleCloseModal={this.handleCloseModal}
              confirmCB={this.handleconfirmModal}
              freezerList={this.state.freezerList}
              selectedItem={this.state.selectedItem}
              store={this.state.store}
              token={this.props.token}
            />
            {this.state.rule_template_ids.length == 0 &&  <ConfirmDialog
              content={"Inspection Custom does not exist  in the rule_template Alert list "}
            />}
            <div style={{ paddingTop: "10px", height: height, overflow: "auto" }}className="CompTable">
              <table style={{ width: "100%", textAlign: "center" }}>
                <tbody>
                  <tr className="rowDataHeader">
                    <td width={`${viewWidth*7/100}px`}>{Locales.watch.狀態}</td>
                    <td width={`${viewWidth*20/100}px`}>{Locales.watch.冷凍櫃}</td>
                    <td width={`${viewWidth*25/100}px`}>{Locales.watch.執行日期區間}</td>
                    <td width={`${viewWidth*20/100}px`}>{Locales.watch.頻率}</td>
                    <td width={`${viewWidth*10/100}px`}>{Locales.watch.時段}</td>
                    <td width={`${viewWidth*18/100+25}px`} />
                  </tr>
                </tbody>
                <tbody  style={{  maxHeight: ((window.innerHeight - 300 ) + "px")}}>
                  <WatchMissionTabData
                    datalist={this.state.scheduleList}
                    freezerList={this.state.freezerList}
                    handleOpenModal={this.handleOpenModal}
                    handleCloseModal={this.handleCloseModal}
                    handleDeleteModal={this.handleDeleteModal}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class AddScheduleModal extends React.Component {
  constructor(props) {
    super(props);
    let hourList = [];
    let minuteList = [];
    for (let h = 0 ; h < 24 ; h++) {
      hourList.push({ value: paddingLeft(h, 2), label: paddingLeft(h, 2) });
    }
    for (let m = 0 ; m < 60 ; m += 5) {
      minuteList.push({ value: paddingLeft(m, 2), label: paddingLeft(m, 2) });
    }
    this.state = {
      checkData: false,
      selectedItem: {},
      store: undefined,
      from: undefined,
      to: undefined,
      enabled: 1,
      freezer: "",
      week: [],
      hour: "",
      minute: "",
      statusList: [
        { value: "1", label: Locales.watch.啟用 },
        { value: "0", label: Locales.watch.停用 }
      ],
      freezerItems: [],
      weekList: WeekList,
      hourList,
      minuteList
    };
  }

  componentWillReceiveProps(nextProps) {
    const data = this.initData();
    if (nextProps.selectedItem) {
      if (nextProps.selectedItem.schedule) {
        if (nextProps.selectedItem.schedule.start_date) {
          data.from = nextProps.selectedItem.schedule.start_date;
        }
        if (nextProps.selectedItem.schedule.end_date) {
          data.to = nextProps.selectedItem.schedule.end_date;
        }
        if (nextProps.selectedItem.schedule.time) {
          data.hour = nextProps.selectedItem.schedule.time.split(":")[0];
          data.minute = nextProps.selectedItem.schedule.time.split(":")[1];
        }
        if (nextProps.selectedItem.schedule.index) {
          data.week = nextProps.selectedItem.schedule.index;
        }
      }
      data.freezer = nextProps.selectedItem.freezer_id;
      data.enabled = nextProps.selectedItem.enabled;
      data.selectedItem = nextProps.selectedItem;
    } else {
      data.selectedItem = nextProps.selectedItem;
    }
    data.freezerItems = nextProps.freezerList.map(function(f) {
      return { value: f.freezer_id, label: f.name };
    });
    data.store = nextProps.store;
    this.setState(data);
  }

  initData() {
    const data = {
      checkData: false,
      from: undefined,
      to: undefined,
      enabled: 1,
      freezer: "",
      week: [],
      hour: "",
      minute: ""
    };
    return data;
  }

  handleWeeksChange = e => {
    const item = parseInt(e.target.value);
    const isChecked = e.target.checked;
    let week = this.state.week;
    if (isChecked) {
      week.push(item);
    } else {
      let index = week.indexOf(item);
      if (index !== -1) { week.splice(index, 1); }
    }
    this.setState({ week });
  }

  save = () => {
    const {
      from,
      to,
      hour,
      minute,
      freezer,
      week,
      enabled,
      selectedItem,
      store
    } = this.state;
    this.setState({ checkData: false });
    if (!freezer || week.length === 0 || !hour || !minute) {
      this.setState({ checkData: true });
      return;
    }
    let task = {
      task_id: 0,
      name: freezer,
      task_type: "inspect",
      schedule: {
        start_date: from,
        end_date: to,
        time: hour + ":" + minute,
        repeat_interval: "weekly",
        index: week.map(x => parseInt(x))
      },
      freezer_id: freezer,
      branch_id: store.branch_id,
      rule_template_ids: [],
      enabled: enabled == 1
    };
    if (selectedItem && selectedItem.task_id) {
      task.task_id = selectedItem.task_id;
    }
    this.props.confirmCB(task);
  }

  handleFromChange = from => {
    this.setState({ from });
  }

  handleToChange = to => {
    this.setState({ to }, this.showFromMonth);
  }

  showFromMonth = () => {
    const { from, to } = this.state;
    if (!from) {
      return;
    }
    if (moment(to).diff(moment(from), "months") < 2) {
      this.to.getDayPicker().showMonth(from);
    }
  }

  updateDayPickerWrapper() {
    setTimeout(function() {
      const obj = $(".DayPickerInput-OverlayWrapper");
      const layout = obj.closest(".ReactModal__Content");
      let left = obj.offset().left;
      let width = obj.find(".DayPickerInput-Overlay").width();
      let clientWidth = layout.width();
      // console.log(left, width, clientWidth);
      if (left + width > clientWidth) {
        //調整位子
        obj.offset({ left: clientWidth - width + layout.offset().left + 18 });
      }
    }, 0);
  }

  render() {
    const {
      checkData,
      freezer,
      from,
      to,
      freezerItems,
      hourList,
      minute,
      minuteList,
      hour,
      weekList,
      week,
      enabled,
      statusList,
      selectedItem
    } = this.state;
    const props = this.props;
    let fromDate= from && new Date(from) || null
    let toDate= to && new Date(to) || null
    const modifiers = { start: fromDate, end: toDate };
    let freezerCln = "";
    let weekCln = "";
    let hourCln = "";
    let minuteCln = "";
    if (!freezer && checkData) {
      freezerCln = "error";
    }
    if (week.length == 0 && checkData) {
      weekCln = "error";
    }
    if (!hour && checkData) {
      hourCln = "error";
    }
    if (!minute && checkData) {
      minuteCln = "error";
    }
    // console.log(selectedItem.task_id)
    return (
      <SettingTemplateDialog
        isOpen={props.showModal}
        cancelCB={props.handleCloseModal}
        confirmCB={this.save}
        shouldCloseOnOverlayClick={true}
        contentLabel="Minimal Modal Example"
        modalTitle={(selectedItem && selectedItem.task_id) ? Locales.common.修改:Locales.common.新增}
        width={"700px"} >
        <table width="100%" className="CorrectSubpageTable">
          <tbody>
            <tr>
              <td width="30%">
                {Locales.watch.冷凍櫃}<label className="required">*</label>
              </td>
              <td>
                <Select
                  className={freezerCln}
                  options={freezerItems}
                  placeholder={Locales.common.請選擇}
                  value={freezerItems.find(option => option.value === freezer)}
                  onChange={e => this.setState({ freezer: e.value })}
                  style={{ width: "200px" }}
                />
              </td>
            </tr>
            <tr>
              <td>{Locales.watch.執行日期區間}</td>
              <td onClick={this.updateDayPickerWrapper}>
                <div className="InputFromTo compDateRange ExportReportDayPicker "
                  style={{ width: "45%", display: "inline-block" }}>
                  <DayPickerInput
                    value={fromDate}
                    placeholder={Locales.watch.不限_開始日期}
                    format="YYYY/MM/DD"
                    formatDate={formatDate}
                    parseDate={parseDate}
                    dayPickerProps={{
                      selectedDays: [fromDate, { fromDate, toDate }],
                      disabledDays: { after: toDate },
                      toMonth: toDate,
                      modifiers,
                      numberOfMonths: 2,
                      onDayClick: () => this.to.getInput().focus()
                    }}
                    onDayChange={this.handleFromChange}
                  />
                </div>
                <span style={{ width: "10%", display: "inline-block", textAlign: "center" }}>
                  ~
                </span>
                <div className="InputFromTo compDateRange ExportReportDayPicker " style={{ width: "45%", display: "inline-block" }}>
                  <DayPickerInput
                    ref={el => (this.to = el)}
                    value={toDate}
                    placeholder={Locales.watch.不限_結束日期}
                    format="YYYY/MM/DD"
                    formatDate={formatDate}
                    parseDate={parseDate}
                    dayPickerProps={{
                      selectedDays: [fromDate, { fromDate, toDate }],
                      disabledDays: { before: fromDate },
                      modifiers,
                      month: fromDate,
                      fromMonth: fromDate,
                      numberOfMonths: 2
                    }}
                    onDayChange={this.handleToChange}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td>
                {Locales.watch.頻率}<label className="required">*</label>
              </td>
              <td>
                <div className={weekCln}>
                  <label className="checkbox-inline" style={{ padding: "0px" }} />
                  {weekList.map((item, index) => {
                    return (
                      <label className="checkbox-inline" key={index}>
                        <input
                          key={index}
                          type="checkbox"
                          name="notice"
                          checked={week.indexOf(parseInt(item.value)) > -1}
                          value={item.value}
                          onChange={this.handleWeeksChange}
                        />
                        {item.label}
                      </label>
                    );
                  })}
                </div>
              </td>
            </tr>
            <tr>
              <td>
                {Locales.watch.時段}<label className="required">*</label>
              </td>
              <td>
                <div style={{ width: "130px", display: "inline-block" }}>
                  <Select
                    className={hourCln}
                    options={hourList}
                    placeholder={Locales.common.請選擇}
                    value={hourList.find(option => option.value == hour)}
                    onChange={e => this.setState({ hour: e.value })}
                    style={{ width: "200px" }}
                    maxMenuHeight={250}
                  />
                </div>
                <span style={{ display: "inline-block" }}> ： </span>
                <div style={{ width: "130px", display: "inline-block" }}>
                  <Select
                    className={minuteCln}
                    options={minuteList}
                    placeholder={Locales.common.請選擇}
                    value={minuteList.find(option => option.value == minute)}
                    onChange={e => this.setState({ minute: e.value })}
                    style={{ width: "200px" }}
                    maxMenuHeight={250}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td>{Locales.watch.狀態}</td>
              <td>
                <label className="radio-inline" style={{ padding: "0px" }} />
                {statusList.map((item, index) => {
                  return (
                    <label className="radio-inline" key={index}>
                      <input
                        key={index}
                        type="radio"
                        name="notice"
                        checked={enabled == item.value}
                        value={item.value}
                        onChange={e =>
                          this.setState({ enabled: e.target.value })
                        }
                      />
                      {item.label}
                    </label>
                  );
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </SettingTemplateDialog>
    );
  }
}

function paddingLeft(str, lenght) {
  if (str.toString().length >= lenght) return str;
  else return paddingLeft("0" + str, lenght);
}

function WatchMissionTabData(props) {
  const { freezerList } = props;
  let viewWidth = window.innerWidth - 440;
  let dataList = props.datalist;
  dataList.forEach(item=>{
    let freezer = freezerList.find(f => f.freezer_id === item.freezer_id);
    item.freezer_name = freezer? freezer.name:"";
  })
  const sortData = sortByKey(dataList,"freezer_name");
  return _.map(sortData, data => {
    let weekLabel = "";
    if (data.schedule.index.length === 7) {
      weekLabel = Locales.watch.每天;
    } else {
      let weekDatas = WeekList.filter(
        x => data.schedule.index.indexOf(parseInt(x.value)) > -1
      );
      if (weekDatas.length > 0) {
        weekLabel = weekDatas.map(w => w.label).join(",");
      }
    }
    let dateLabel;
    if (data.schedule.start_date && data.schedule.end_date) {
      dateLabel = (
        <div>
          <span>{moment(data.schedule.start_date).format("YYYY/MM/DD")}</span> ~{" "}
          <span style={{ whiteSpace: "nowrap" }}>{moment(data.schedule.end_date).format("YYYY/MM/DD")}</span>
        </div>
      );
    } else if (data.schedule.start_date) {
      dateLabel = (
        <div>
          <span> {Locales.watch.起.format(moment(data.schedule.start_date).format("YYYY/MM/DD"))}</span>
        </div>
      );
    } else if (data.schedule.end_date) {
      dateLabel = (
        <div>
          <span> {Locales.watch.止.format(moment(data.schedule.end_date).format("YYYY/MM/DD"))}</span>
        </div>
      );
    } else {
      dateLabel = (
        <div>
          <span>{Locales.common.不限}</span>
        </div>
      );
    }
    return (
      <tr key={Math.random()} className="rowDataContent" style={{height:"51px"}}>
        <td width={`${viewWidth*7/100}px`}>{data.enabled ? Locales.watch.啟用 : Locales.watch.停用}</td>
        <td width={`${viewWidth*20/100}px`}>{data.freezer_name}</td>
        <td width={`${viewWidth*25/100}px`} style={{padding: "0PX"}}>{dateLabel}</td>
        <td width={`${viewWidth*20/100}px`}>{weekLabel}</td>
        <td width={`${viewWidth*10/100}px`}>{data.schedule.time}</td>
        <td width={`${viewWidth*18/100+25}px`}>
          <Button onClick={props.handleOpenModal.bind(this, data)}>
            {Locales.common.修改}
          </Button>{" "}
          <Button onClick={props.handleDeleteModal.bind(this, data)} bsClass="btn btn-danger">
            {Locales.common.刪除}
          </Button>
        </td>
      </tr>
    );
  });
}

function mapStateToProps({ store, token,user }, ownProps) {
  return { store, token ,user};
}

//this.props.fetchPost
//this.props.deletePost
export default connect(
  mapStateToProps,
  {}
)(WatchScheduleSubpage);
