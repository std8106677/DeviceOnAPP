import { connect } from "react-redux";
import React, { Component } from "react";
import { Button } from "react-bootstrap";
import * as XLSX from "xlsx";
import {Locales} from '../lang/language';

class ImportExcelButton extends Component {
    constructor(props) {
        super(props);
        const {id} =this.props;
        let inputID = (id ? id :"importExcel")+"Input";
        this.state = {
            inputID
        }
    }

    importExcelClick = () => {
      document.getElementById(this.state.inputID).click();
    };
    
  onImportExcel = file => {
      if(typeof(this.props.blockSetting)){
        this.props.blockSetting();
      }      
    // 獲取上傳的文檔對象
    const { files } = file.target;
    // 通過FileReader對象讀取文檔
    const fileReader = new FileReader();
    fileReader.onload = event => {
      try {
        const { result } = event.target;
        // 以二進制流方式讀取得到整份excel表格對象
        const workbook = XLSX.read(result, { type: "binary" });
        let data = []; // 存儲獲取到的數據
        // 遍歷每張工作表進行讀取（這裏默認只讀取第一張表）
        for (const sheet in workbook.Sheets) {
          let sheetData = {
            sheetName: sheet,
            data: []
          };
          if (workbook.Sheets.hasOwnProperty(sheet)) {
            // 利用 sheet_to_json 方法將 excel 轉成 json 數據
            sheetData.data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], {
              header: 1
            });
            data = data.concat(sheetData);
          }
        }
        // console.log(data);
        this.props.setData(data);
        
        document.getElementById(this.state.inputID).value = "";
      } catch (e) {
        // 這裏可以拋出文檔類型錯誤不正確的相關提示
        console.log("文檔類型不正確");
        return;
      }
    };
    // 以二進制方式打開文檔
    fileReader.readAsBinaryString(files[0]);
  };
  render() {
    return (
        <div className="react-file-reader-button" style={{display:"inline-block"}}>
          <Button
            style={{
              width: "120px",
              margin: "0px 20px 0 0",
              boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.2)"
            }}
            onClick={this.importExcelClick}
          >
            {Locales.common.匯入}
          </Button>
            <input
              type="file"
              id={this.state.inputID}
              accept=".xlsx, .xls, .csv"
              onChange={this.onImportExcel}
              style={{ display: "none" }}
            />
        </div>
    );
  }
}

function mapStateToProps({}, ownProps) {
  return {};
}

//this.props.fetchPost
//this.props.deletePost
export default connect(
  mapStateToProps,
  {}
)(ImportExcelButton);

//extend FileReader
if (!FileReader.prototype.readAsBinaryString) {
  FileReader.prototype.readAsBinaryString =function (fileData) {
    var binary = "";
    var pt = this;
    var reader = new FileReader();
    reader.onload = function (e) {
        var bytes = new Uint8Array(reader.result);
        var length = bytes.byteLength;
        for (var i = 0; i < length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        pt.target = {result:binary};
        pt.content = binary;
        pt.onload(pt); //页面内data取pt.content文件内容
      }
      reader.readAsArrayBuffer(fileData);
    }
}