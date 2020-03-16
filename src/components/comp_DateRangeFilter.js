import React, { Component } from "react";
import moment from 'moment';
import { connect } from "react-redux";
import { setUser,setSearchFilter,setTransportFilter,setGoodsFilter,setWatchFilter,setAbnormalFilter} from "../actions";
import { Button, FormGroup, FormControl, ControlLabel, DropdownButton, MenuItem} from "react-bootstrap";
import MultiSelect from '@khanacademy/react-multi-select';
import {apiLogin} from "../utils/api"
import { Redirect } from "react-router-dom";
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { formatDate, parseDate } from 'react-day-picker/moment';
import {Locales} from '../lang/language';
import AlertDialog from '../components/alert_dialog';
class DateRangeFilter extends Component {
  constructor(props) {
    super(props);
    this.handleFromChange = this.handleFromChange.bind(this);
    this.handleToChange = this.handleToChange.bind(this);
    this.handleResultSelectedChanged = this. handleResultSelectedChanged.bind(this);
    this.handleOtherSelectedChanged = this. handleOtherSelectedChanged.bind(this);
    this.dropdownItems = (typeof props.dropdownItems!='undefined' ? props.dropdownItems:null);
    this.dropdownOther = (typeof props.dropdownOther!='undefined' ? props.dropdownOther:null); //optional
    this.timeLable = (typeof props.timeLable!='undefined'? props.timeLable:Locales.common.時間);
    this.resultLable = (typeof props.resultLable!='undefined'? props.resultLable:Locales.common.結果);
    this.otherLable = (typeof props.otherLable!='undefined'? props.otherLable:'');

    //console.log("from:",props.From," To:",props.To);
    let dateTo = moment().add('1','days').format('YYYY/MM/DD');
    dateTo = moment(dateTo).add('-1','seconds').format('YYYY/MM/DD  HH:mm:ss');
    this.state = {
      from: (typeof props.From!="undefined" && props.From!="undefined")? new Date(props.From):new Date(moment().add('-6','days').format('YYYY/MM/DD')),
      to: (typeof props.To!="undefined" && props.To!="undefined") ? new Date(props.To):new Date(dateTo),
      resultItem:(typeof props.selectedItems!='undefined'? props.selectedItems:[]),
      otherItem:(typeof props.selectedOther!='undefined' ? props.selectedOther:[]),
      filterType:(typeof props.Type!='undefined' ?　props.Type : ""),
      showAlertDialog:false,
      showAlertModalContent:""
    };

    //let selstores = this.props.store.filter(s => s.select == true);
    //let seldepart = this.props.storeDepartment.filter(d => d.select == true);
    switch (this.state.filterType) {
      case "transport":
        this.props.setTransportFilter({From:moment(this.state.from).format('YYYY/MM/DD HH:mm:ss'),To:moment(this.state.to).format('YYYY/MM/DD HH:mm:ss'), Filter:this.state.resultItem, FilterType:this.state.otherItem,doSearch:false});
        break;
      case "goods":
        this.props.setGoodsFilter({From:moment(this.state.from).format('YYYY/MM/DD HH:mm:ss'),To:moment(this.state.to).format('YYYY/MM/DD HH:mm:ss'), Filter:this.state.resultItem, FilterType:this.state.otherItem,doSearch:false});
        break;
      case "watch":
        this.props.setWatchFilter({From:moment(this.state.from).format('YYYY/MM/DD HH:mm:ss'),To:moment(this.state.to).format('YYYY/MM/DD HH:mm:ss'), Filter:this.state.resultItem, FilterType:this.state.otherItem,doSearch:false});
        break;
      case "abnormal":
        this.props.setAbnormalFilter({From:moment(this.state.from).format('YYYY/MM/DD HH:mm:ss'),To:moment(this.state.to).format('YYYY/MM/DD HH:mm:ss'), Filter:this.state.resultItem, FilterType:this.state.otherItem,doSearch:false});
        break;
      default:
        this.props.setSearchFilter({From:moment(this.state.from).format('YYYY-MM-DD HH:mm:ss'),To:moment(this.state.to).format('YYYY-MM-DD HH:mm:ss'), Filter:this.state.resultItem, FilterType:this.state.otherItem});
        break;
    }
    //
  }

  showFromMonth() {
    const { from, to } = this.state;
    if (!from) {
      return;
    }
    if (moment(to).diff(moment(from), 'months') < 2) {
      this.to.getDayPicker().showMonth(from);
    }
  }
  handleFromChange(from) {
    // Change the from date and focus the "to" input field
    //console.log("from:",data);
    if (moment(this.state.to).diff(moment(from), 'months') >2) {
      this.handleSetAlertContent(Locales.common.日期區間不能大於3個月);
      from = new Date(moment(this.state.to).subtract(3,'months').add(1,'days'));
      console.log("from:",from)
      this.setState({ from });
    }else{
      this.setState({ from });
    }
  }
  handleToChange(to) {
    if (moment(to).diff(moment(this.state.from), 'months') >2) {
      this.handleSetAlertContent(Locales.common.日期區間不能大於3個月);
      to = new Date(moment(this.state.from).add(3,'months').subtract(1,'days'));
      this.setState({ to }, this.showFromMonth);
    }else{
      this.setState({ to }, this.showFromMonth);
    }
  }

  handleResultSelectedChanged(selected) {
  /*  console.log("selected:",selected);
    if(selected.length==0){
      let selAll = [];
      this.dropdownItems.forEach(function(element) {
        selAll.push(element.value);
      });
      this.setState({resultItem:selAll});
    }else{*/
      this.setState({resultItem:selected});
    //}

  }

  handleOtherSelectedChanged(selected) {
    if(selected.length==0){
      console.log("no selected");
    }
    this.setState({otherItem:selected});
  }

  handleCloseAlertModal =()=>{
    this.setState({showAlertDialog:false});
    this.setState({showAlertModalContent:""});
  }

  handleSetAlertContent = (content)=>{
    //console.log(content);
    this.setState({showAlertModalContent:content});
    this.setState({showAlertDialog:true});
  }

  doSearch = (dateFrom, dateTo, result, other, filterType) => {
    //console.log("dateFrom",dateFrom);
    if(typeof dateFrom == 'undefined' || typeof dateTo=="undefined" ){
        this.handleSetAlertContent(Locales.common.需選擇時間區間);
        return;
    }
    dateFrom = moment(dateFrom).format('YYYY-MM-DD');
    dateTo = moment(dateTo).format('YYYY-MM-DD');
    //console.log("dropdownItems:",dropdownItems);
    if(this.dropdownItems != null && result.length==0){
      this.dropdownItems.forEach(function(element) {
        result.push(element.value);
      });
      //props.setState({resultItem:result});
    }

    if(other.length==0 && this.dropdownOther!=null){
      this.dropdownOther.forEach(function(element) {
        other.push(element.value);
      });
      //props.setState({otherItem:other});
    }

    //console.log("filter type",filterType);
    //let selstores = this.props.store.filter(s => s.select == true);
    //let seldepart = this.props.storeDepartment.filter(d => d.select == true);
    switch (filterType) {
      case "transport":
        this.props.setTransportFilter({From:moment(dateFrom).format('YYYY/MM/DD HH:mm:ss'),To:moment(dateTo).add(1,'days').add(-1,'seconds').format('YYYY/MM/DD HH:mm:ss'), Filter:result, FilterOther:other, doSearch:true});
        break;
      case "goods":
        this.props.setGoodsFilter({From:moment(dateFrom).format('YYYY/MM/DD HH:mm:ss'),To:moment(dateTo).add(1,'days').add(-1,'seconds').format('YYYY/MM/DD HH:mm:ss'), Filter:result, FilterOther:other, doSearch:true});
        break;
      case "watch":
        this.props.setWatchFilter({From:moment(dateFrom).format('YYYY/MM/DD HH:mm:ss'),To:moment(dateTo).add(1,'days').add(-1,'seconds').format('YYYY/MM/DD HH:mm:ss'), Filter:result, FilterOther:other, doSearch:true});
        break;
      case "abnormal":
        this.props.setAbnormalFilter({From:moment(dateFrom).format('YYYY/MM/DD HH:mm:ss'),To:moment(dateTo).add(1,'days').add(-1,'seconds').format('YYYY/MM/DD HH:mm:ss'), Filter:result, FilterOther:other, doSearch:true});
        break;
      default:
        this.props.setSearchFilter({From:moment(dateFrom).format('YYYY/MM/DD HH:mm:ss'),To:moment(dateTo).add(1,'days').add(-1,'seconds').format('YYYY/MM/DD HH:mm:ss'), Filter:result, FilterOther:other});
        break;
    }
  }

  render() {
    const { from, to, resultItem, otherItem, filterType } = this.state;
    //console.log(resultItem);
    const modifiers = { start: from, end: to };
    let headDateRangeCln = "col-lg-4";
    if(this.timeLable.length >= 4){
      headDateRangeCln = "col-lg-5";
    }
    let headResultCln = "col-lg-3";
    if(resultItem.length > 2){
      headResultCln = "col-lg-4";
    }
    //console.log("showAlertDialog ",this.state.showAlertDialog);
    return (
      <div className="DateRangeFilter" >
      {this.state.showAlertDialog && (
        <div>
        <AlertDialog
          content={this.state.showAlertModalContent}
          confirmCB={this.handleCloseAlertModal}
        />
        </div>
      )}

        <div className="dateFilter">
          <div className="row align-items-center" style = {{marginTop: "1%"}}>
            <div className={"col-md-6 col-sm-8 col-12 form-group "+headDateRangeCln}>
              <table style={{width:"100%"}}>
              <tbody>
                <tr style = {{fontSize:"18px",versicalAlign:"middle",textAlign:"center"}}>
                  <td style={{color:"#FFF",width:"13%",whiteSpace:"nowrap"}}>{this.timeLable}：</td>
                  <td style={{width:"20%"}}>
                    <div className="InputFromTo compDateRange">
                      <DayPickerInput value={from} placeholder={Locales.common.開始日期} format='YYYY/MM/DD' formatDate={formatDate} parseDate={parseDate}
                        dayPickerProps={{selectedDays: [from, { from, to }],disabledDays: { after: to },toMonth: to, modifiers, numberOfMonths: 2,onDayClick: () => this.to.getInput().focus()}}
                        onDayChange={this.handleFromChange}
                      />
                      </div>
                    </td>
                    <td style={{color:"#FFF",width:"2%",textAlign:"center"}}>
                      ～
                    </td>
                    <td style={{width:"20%"}}>
                      <div className="InputFromTo compDateRange">
                      <span className="InputFromTo-to compDateRange">
                        <DayPickerInput
                          ref={el => (this.to = el)}
                          value={to}
                          placeholder={Locales.common.結束日期}
                          format='YYYY/MM/DD'
                          formatDate={formatDate}
                          parseDate={parseDate}
                          dayPickerProps={{
                            selectedDays: [from, { from, to }],
                            disabledDays: { before: from },
                            modifiers,
                            month: from,
                            fromMonth: from,
                            numberOfMonths: 2,
                          }}
                          onDayChange={this.handleToChange}
                        />
                      </span>
                      </div>
                    </td>
                </tr>
                </tbody>
              </table>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-8 col-12 form-group" style={this.dropdownOther==null ? {display:"none"}:{display:"show"} }>
              <table style={{ width:"100%" }}>
              <tbody>
                <tr>
                  <td style={{width:"40%",color:"#FFF",textAlign:"right",fontSize:"18px",whiteSpace:"nowrap"}}>{this.otherLable}：</td>
                  <td style={{width:"60%"}}>
                    <div className = "DropdownResult">
                      <DropdownResult  title={otherItem} id="DropdownOther" items={this.dropdownOther==null ? []:this.dropdownOther} onSelect={this.handleOtherSelectedChanged}/>
                    </div>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
            <div className={"col-md-4 col-sm-8 col-12 form-group "+headResultCln} style={this.dropdownItems==null ? {display:"none"}:{display:"show"} }>
              <table style={{ width:"100%" }}>
              <tbody>
                <tr>
                  <td style={{width:"30%",color:"#FFF",textAlign:"right",fontSize:"18px"}}>{this.resultLable}：</td>
                  <td style={{width:"60%"}}>
                    <div className = "DropdownResult">
                      <DropdownResult  title={resultItem} id="DropdownAbnormal" items={this.dropdownItems==null ? []:this.dropdownItems} onSelect={this.handleResultSelectedChanged}/>
                    </div>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
            <div className="col-lg-1 col-md-2 form-group" style={{height:"50%"}}>
              <div className = "btnDateSearch" style={{cursor:"pointer"}}
                    onClick={()=>this.doSearch(from,to,resultItem, otherItem,filterType)}>{Locales.common.搜尋}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function DropdownResult(props){
  let selAll = ""
  if(props.items.length>0){
    props.items.forEach(function(element) {
      selAll = selAll+element.label+",";
    });
    selAll = selAll.substring(0,selAll.length-1);
  }
  return(
    <MultiSelect
      options={props.items}
      selected={props.title}
      onSelectedChanged={props.onSelect}
      disabled={false}
      disableSearch={true}
      overrideStrings={{
        selectSomeItems: Locales.common.所有結果,//Locales.common.請選擇欲搜尋的結果,
        allItemsAreSelected: selAll,//Locales.common.所有結果,
        selectAll: Locales.common.所有結果,
        search: "Search",
      }}
    />
  );
}

/*function doSearch(props,dateFrom, dateTo, result, other, filterType,dropdownItems,dropdownOther,handleSetAlertContent){
  //console.log("dateFrom",dateFrom);
  if(typeof dateFrom == 'undefined' || typeof dateTo=="undefined" ){
      handleSetAlertContent(Locales.common.需選擇時間區間);
      return;
  }
  dateFrom = moment(dateFrom).format('YYYY-MM-DD');
  dateTo = moment(dateTo).format('YYYY-MM-DD');
  //console.log("dropdownItems:",dropdownItems);
  if(dropdownItems != null && result.length==0){
    dropdownItems.forEach(function(element) {
      result.push(element.value);
    });
    //props.setState({resultItem:result});
  }

  if(other.length==0 && dropdownOther!=null){
    dropdownOther.forEach(function(element) {
      other.push(element.value);
    });
    //props.setState({otherItem:other});
  }

  //console.log("filter type",filterType);
  switch (filterType) {
    case "transport":
      props.setTransportFilter({From:moment(dateFrom).format('YYYY/MM/DD HH:mm:ss'),To:moment(dateTo).add(1,'days').add(-1,'seconds').format('YYYY/MM/DD HH:mm:ss'), Filter:result, FilterOther:other, doSearch:true});
      break;
    case "goods":
      props.setGoodsFilter({From:moment(dateFrom).format('YYYY/MM/DD HH:mm:ss'),To:moment(dateTo).add(1,'days').add(-1,'seconds').format('YYYY/MM/DD HH:mm:ss'), Filter:result, FilterOther:other, doSearch:true});
      break;
    case "watch":
      props.setWatchFilter({From:moment(dateFrom).format('YYYY/MM/DD HH:mm:ss'),To:moment(dateTo).add(1,'days').add(-1,'seconds').format('YYYY/MM/DD HH:mm:ss'), Filter:result, FilterOther:other, doSearch:true});
      break;
    case "abnormal":
      props.setAbnormalFilter({From:moment(dateFrom).format('YYYY/MM/DD HH:mm:ss'),To:moment(dateTo).add(1,'days').add(-1,'seconds').format('YYYY/MM/DD HH:mm:ss'), Filter:result, FilterOther:other, doSearch:true,});
      break;
    default:
      props.setSearchFilter({From:moment(dateFrom).format('YYYY/MM/DD HH:mm:ss'),To:moment(dateTo).add(1,'days').add(-1,'seconds').format('YYYY/MM/DD HH:mm:ss'), Filter:result, FilterOther:other});
      break;
  }
}*/

function mapStateToProps({ searchfilter ,filtertransport,filtergoods,filterwatch,filterabnoraml}, ownProps) {
  return {searchfilter,filtertransport,filtergoods,filterwatch,filterabnoraml};
}


//this.props.fetchPost
//this.props.deletePost
export default connect(mapStateToProps, { setSearchFilter,setTransportFilter,setGoodsFilter,setWatchFilter,setAbnormalFilter})(DateRangeFilter);
