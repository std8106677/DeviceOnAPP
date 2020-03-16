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
import { apiBranchList, apiFreezerList, apiFreezerHistory, toCancelApi } from "../utils/api";
import moment from 'moment';
import {Locales} from '../lang/language';
import BlockUi from 'react-block-ui';

class FreezerHistorySubpage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      DateFrom: moment().add('-6','days').format('YYYY/MM/DD'),
      DateTo: moment().format('YYYY/MM/DD'),
      selectBranchId: "",
      freezerHistoryList: [],
    };
  }

  componentWillUnmount(){
    toCancelApi();
  }

  componentWillReceiveProps(nextProps) {
    const {searchfilter,store} = nextProps;
    for(let i=0 ; i<store.length ; ++i) {
      if(store[i].select) {
        this.setState({ selectBranchId: store[i].branch_id,
                        DateFrom: moment(searchfilter.From).format("YYYY/MM/DD"),
                        DateTo: moment(searchfilter.To).format("YYYY/MM/DD") }, function() {
          this.getFreezerList();
        });
        break;
      }
    }
  }

  getFreezerList() {
    const { token, storeDepartment } = this.props;
    var data = {
      branch_id: this.state.selectBranchId,
      token: token
    }
    this.setState({blocking: true});
    apiFreezerList(data)
    .then(function (response) {
      let freezerMap = [], freezer_ids = [], freezerHistoryList = [], departmentMap = [];
      for(let i=0 ; i<storeDepartment.length ; ++i) {
        departmentMap[storeDepartment[i].id] = storeDepartment[i].name;
      }
      for(let i=0 ; i<response.data.freezers.length ; ++i) {
        freezer_ids.push(response.data.freezers[i].freezer_id);
        freezerMap[response.data.freezers[i].freezer_id] = response.data.freezers[i];
      }
      if(freezer_ids.length == 0) {
        this.setState({blocking: false});
        alert(Locales.common.此地點無冰箱);
      }
      for(let i=0 ; i<freezer_ids.length ; ++i) {
        var data = {
          freezer_id: freezer_ids[i],
          action: [],
          period: [ this.state.DateFrom, this.state.DateTo ],
          token: token
        }
        apiFreezerHistory(data)
        .then(function (response) {
          response.data.freezerName = freezerMap[response.data.freezer_id] ? freezerMap[response.data.freezer_id].name : "";
          response.data.department = freezerMap[response.data.freezer_id] ? departmentMap[freezerMap[response.data.freezer_id].department_id] : "";
          freezerHistoryList.push(response.data);
          if(freezerHistoryList.length == freezer_ids.length) {
            //console.log("freezerHistoryList, ", freezerHistoryList);
            this.setState({blocking: false, freezerHistoryList});
          }
        }.bind(this))
        .catch(function (error) {
          console.log(error);
          this.setState({blocking: false});
        }.bind(this));
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
      this.setState({blocking: false});
    }.bind(this));
  }

  dateFormatter=(cell, row)=>{
    return moment(cell).format("YYYY/MM/DD HH:mm")
  }

  render() {
    let viewWidth = window.innerWidth - 370;
    const columns = [
      {
        dataField: "freezer_name",
        text: Locales.freezer.冷凍櫃名稱,
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
        dataField: "department",
        text: Locales.freezer.部門,
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
        dataField: "history",
        text: Locales.backend.操作紀錄,
        sort: true,
        filter: textFilter(),
        headerStyle: () => {
          return {
            width: `${viewWidth*30/100}px`
          };
        },
        style: {
          width: `${viewWidth*30/100}px`,
          wordWrap: "break-word"
        }
      },
      {
        dataField: "date",
        text: Locales.common.時間,
        sort: true,
        formatter:this.dateFormatter,
        headerStyle: () => {
          return {
            width: `${viewWidth*30/100}px`
          };
        },
        style: {
          width: `${viewWidth*30/100}px`
        }
      }
    ];

    const defaultSorted =[{
      dataField: 'date', // if dataField is not match to any column you defined, it will be ignored.
      order: 'desc' // desc or asc
    }];
    var height = (window.innerHeight - 200) + "px";
    let resultData = [];
    for(let i=0 ; i<this.state.freezerHistoryList.length ; ++i) {
      for(let j=0 ; j<this.state.freezerHistoryList[i].events.length ; ++j) {
        resultData.push({
          freezer_name: this.state.freezerHistoryList[i].freezerName,
          department: this.state.freezerHistoryList[i].department,
          history: this.state.freezerHistoryList[i].events[j].action,
          date: this.state.freezerHistoryList[i].events[j].ts
        })
      }
    }
    //console.log("resultData, ", resultData);
    return (
      <BlockUi tag="div" className={this.state.blocking ? "BlockUI" : ""} blocking={this.state.blocking} message={Locales.common.加載中}>
        <div className="Subpage">
          <DateRangePicker From={this.state.DateFrom} To={this.state.DateTo}/>
          <div className="CorrectSubpage">
              <div style={{ paddingTop: "10px", height: height, overflow: "auto" }}>
                <CompTable
                  keyField="date"
                  data={resultData}
                  columns={columns}
                  defaultSorted={defaultSorted}
                />
              </div>
          </div>
        </div>
      </BlockUi>
    );
  }
}

function mapStateToProps({ store, searchfilter, storeDepartment, token }, ownProps) {
  return { store, searchfilter, storeDepartment, token };
}

//this.props.fetchPost
//this.props.deletePost
export default connect(
  mapStateToProps,
  {}
)(FreezerHistorySubpage);
