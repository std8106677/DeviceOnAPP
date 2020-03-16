import React from "react";
import BootstrapTable from "react-bootstrap-table-next";
import filterFactory from "react-bootstrap-table2-filter";
import paginationFactory, {
  PaginationProvider,
  PaginationListStandalone,
  SizePerPageDropdownStandalone
} from "react-bootstrap-table2-paginator";
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';
import {Locales} from '../lang/language';
import { Button} from "react-bootstrap";
import {hasKey, sortByKey,showRowNum} from "../utils/common"

const customTotal = (from, to, size) => (
  <span className="react-bootstrap-table-pagination-total">
    {Locales.common.tableRecord.format(from, to, size)}
  </span>
);

class CompTable extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
        viewData:this.props.data.slice(0, 20),
        filterData:this.props.data,
        page:0,
        totalSize:this.props.data.length
    }
  }
  componentWillReceiveProps(nextProps) {
    this.setState(nextProps);
  }
  onTableChange = (type, { page, sizePerPage, filters, sortField, sortOrder }) => {
    const currentIndex = (page - 1) * sizePerPage;
    setTimeout(() => {
      let result = this.props.data;
      // Handle column filters
      result = result.filter((row) => {
        let valid = true;
        for (const dataField in filters) {
          const { filterVal, filterType, comparator } = filters[dataField];

          if (filterType === 'TEXT') {
            if (comparator === Comparator.LIKE) {
              valid = row[dataField].toString().indexOf(filterVal) > -1;
            } else {
              valid = row[dataField] === filterVal;
            }
          }
          if (!valid) break;
        }
        return valid;
      });
      // Handle column sort
      if (sortOrder === 'asc') {
        result = result.sort((a, b) => {
          if (a[sortField] > b[sortField]) {
            return 1;
          } else if (b[sortField] > a[sortField]) {
            return -1;
          }
          return 0;
        });
      } else {
        result = result.sort((a, b) => {
          if (a[sortField] > b[sortField]) {
            return -1;
          } else if (b[sortField] > a[sortField]) {
            return 1;
          }
          return 0;
        });
      }
      this.setState(() => ({
        page,
        viewData: result.slice(currentIndex, currentIndex + sizePerPage),
        totalSize: result.length,
        sizePerPage
      }));
    }, 2000);
  }

  render() {
    const { keyField, data, columns, defaultSorted } = this.props;
    const { viewData,totalSize} = this.state;
    const PaginationOptionsForTop = {
      custom: true,
      paginationSize: 3,
      pageStartIndex: 1,
      showTotal: true,
      totalSize: totalSize
    }
    const PaginationOptions = {
      // custom: true,
      // totalSize: totalSize,
      paginationSize: 3,
      pageStartIndex: 1,
      // alwaysShowAllBtns: true, // Always show next and previous button
      // withFirstAndLast: false, // Hide the going to First and Last page button
      // hideSizePerPage: true, // Hide the sizePerPage dropdown always
      // hidePageListOnlyOnePage: true, // Hide the pagination list when only one page
      showTotal: true,
      paginationTotalRenderer: customTotal,
      sizePerPageList: [
        {
          text: "20",
          value: 20
        }
      ] // A numeric array is also available. the purpose of above example is custom the text
    };
    const contentTable = ({ paginationProps, paginationTableProps }) => (
      <div>
        <PaginationListStandalone { ...paginationProps } />
        <div>
          <div>
            <BootstrapTable
              striped
              hover
              keyField={keyField}
              data={ data }
              columns={ columns }
              defaultSorted={ defaultSorted }
              filter={ filterFactory() }
              onTableChange={ this.onTableChange }
              { ...paginationTableProps }
            />
          </div>
        </div>
        <PaginationListStandalone { ...paginationProps } />
      </div>
    );
    return (
      <div className="CompTable">
       {/* <PaginationProvider
          pagination={
            paginationFactory(PaginationOptionsForTop)
          }
        >
          { contentTable }
        </PaginationProvider> */}
        <BootstrapTable
          keyField={keyField}
          data={data}
          columns={columns}
          defaultSorted={ defaultSorted }
          filter={filterFactory()}
          pagination={paginationFactory(PaginationOptions)}
        />
      </div>
    );
  }
}
//export default CompTable;

class CompSearchedTable extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.searchedFields = [];
    this.tableChanged = false;
    this.showMoreButton = false;
    this.state = {
        viewData:props.data,
        searchText:"",
        showMoreButton:true,
        showLastIndex:showRowNum
    }
  }

  handleMoreButton = ()=>{
    //console.log("this.props.data:",this.props.data.length);
    this.tableChanged = true;
    //console.log("1.this.state.showLastIndex:",this.state.showLastIndex);
    let nowindex = this.state.showLastIndex + showRowNum;
    //console.log("nowindex:",nowindex);
    if(this.props.data.length > nowindex){
      this.setState({showLastIndex:nowindex,showMoreButton:true});
    }else{
      this.setState({showLastIndex:this.props.data.length,showMoreButton:false});
    }
  }

  onTableChange = (type, { data,searchText,sortField, sortOrder }) => {
    //console.log("searchText",searchText);
    //console.log(type);
    setTimeout(() => {
      let result = [];
      if(type == "search"){
        result = this.props.data.filter((row) => {
          for(let i=0; i<this.searchedFields.length; i++){
                let field = this.searchedFields[i];
                if (row[field].indexOf(searchText) > -1) {//if(row["branch"].indexOf(searchString)>-1){

                    return true;
                }
          }
        });
      }else if(type == "sort"){
        result = sortByKey(data, sortField, false, false, sortOrder != 'asc');
      }
      //console.log("result:",result);

      this.setState(() => ({
        viewData: result,
        searchText:(searchText||""),
        showMoreButton: (result.length<=this.state.showLastIndex)? false : true
      }));
      this.tableChanged = true;
    }, 1000);
  }

  render() {
    //console.log("this.tableChanged",this.tableChanged);
    const { id, keyField, defaultSorted, data, columns, expandRow, rowClasses, rowEvents, searchedField,placeholder} = this.props;
    this.searchedFields = searchedField;
    let viewData = ((this.state.viewData.length==0 && this.state.searchText=="") || (!this.tableChanged && this.state.searchText=="")) ? data : this.state.viewData;
    //console.log("viewData length:",viewData.length);
    //console.log("this.tableChanged:",this.tableChanged);
    if(this.tableChanged) {
      this.tableChanged = false;
      this.showMoreButton = this.state.showMoreButton;
      //console.log("this.tableChanged:",this.tableChanged);
    }else{
      if(viewData.length<=this.state.showLastIndex ){
        this.showMoreButton = false;
      }else{
        this.showMoreButton = true;
      }
    }
    let hiddenRowKeys = [];
    for(let i=this.state.showLastIndex; i<viewData.length;i++){
      hiddenRowKeys.push(viewData[i].id);
    }

    //console.log("showLastIndex",this.state.showLastIndex);
    //console.log("viewData",viewData);
    const { SearchBar } = Search;
    return (
      <div>
      <ToolkitProvider
        keyField='id'
        data={viewData}
        columns={ columns }
        search
      >
      {
        props => (
          <div>
            <SearchBar { ...props.searchProps }
              style={ { width: '330px', margin:"20px 30px 10px 0",float:"right" } }
              placeholder={placeholder}
            />
            <BootstrapTable
              { ...this.props }
              { ...props.baseProps }
              hiddenRows = {hiddenRowKeys}
              bordered={ false }
              classes='tableList'
              headerClasses = 'tableHeader'
              remote={ { pagination: false, filter: false, sort: true,search:true } }
              onTableChange={this.onTableChange}
              //filter={ filterFactory()}
            />
          </div>
        )
      }
      </ToolkitProvider>
      <Button className="moreButton" style={{display:this.showMoreButton ? 'block':'none'}} onClick={this.handleMoreButton}>{Locales.common.更多}</Button>
      </div>
    );
  }
}

export {
  CompTable,
  CompSearchedTable,
}
