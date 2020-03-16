
import axios from "./axios_setting";
import "@babel/polyfill";
const SERVER_ADDRESS = '';//'https://ccm-dev.ushop-plus.com';
//const SERVER_ADDRESS = 'https://ccmtest-dev.ushop-plus.com/';
const { CancelToken } = axios;
let apiCancelList =[];
export function toCancelApi(){
  while (apiCancelList.length > 0) {
    apiCancelList.pop()('取消連線');
  }
}

export function apiLogin(data) {
  const body = {
    username: data.username,
    password: data.password
  };
  return axios.post("/api/login", body);
}

export function apiLogout(token) {
  const body = {
    token: token
  };
  return axios.post("/api/logout", body);
}

export function apiIslogin(token) {
  const body = {
    token: token
  };
  return axios.post("/api/islogin", body);
}

export function apiServerInfo() {
  return axios.post("/api/server/info");
}

// =========================== Define =========================== //
export function apiDefineTypeList(token) {
  const body = {
    token: token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/define/type_list", body);
}

export function apiDefineList(data) {
  const body = {
    define_type: data.type,
    token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/define/list", body);
}

export function apiDefineAdd(data) {
  const body = {
    define_type: data.type,
  	define: {
  		code: data.code,
  		name: data.name,
      extension:(typeof data.extension != 'undefined'?data.extension:"")
  	},
    token: data.token
  };
  return axios.post("/api/define/add", body);
}

export function apiDefineUpdate(data) {
  const body = {
    define_type: data.type,
  	define: {
  		code: data.code,
  		id: data.id,
  		name: data.name,
      extension:(typeof data.extension != 'undefined' ? data.extension : {}),
      state_machine:(typeof data.state_machine != 'undefined' ? data.state_machine : {})
  	},
    token: data.token
  };
  return axios.post("/api/define/update", body);
}

export function apiDefineDelete(data) {
  const body = {
    define_ids: data.ids,
    token: data.token
  };
  return axios.post("/api/define/delete", body);
}
// =========================== Define =========================== //

// =========================== Branch =========================== //
export function apiBranchList(token) {
  const body = {
    user_id: token.user_id,
    token: token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/branch/list", body);
}

export function apiBranchAdd(data) {
  const body = {
  	branch_name: data.name,
  	branch_code: data.code,
  	type_id: data.type,
  	region_id: data.region,
  	org_id: "",
  	country: "Taiwan",
  	province: "Taiwan",
  	city: "Taipei",
  	address: "xxx",
  	time_zone: "+8",
  	tel: "1111",
  	descr: data.note,
    token: data.token
  };
  return axios.post("/api/branch/add", body);
}

export function apiBranchUpdate(data) {
  const body = {
    branch:{
	    branch_id: data.id,
    	branch_name: data.name,
    	branch_code: data.code,
    	type_id: data.type,
    	region_id: data.region,
    	org_id: "",
    	country: "Taiwan",
    	province: "Taiwan",
    	city: "Taipei",
    	address: "xxx",
    	time_zone: "+8",
    	tel: "1111",
    	descr: data.note
    },
    token: data.token
  };
  return axios.post("/api/branch/update", body);
}

export function apiBranchDelete(data) {
  const body = {
    branch_id: data.branch_id,
    token: data.token
  };
  return axios.post("/api/branch/delete", body);
}
// =========================== Branch =========================== //

// =========================== Data =========================== //
export function apiDataRetrieve(data) {
  const body = {
    retrieve_type: data.type,
  	target_id: data.targetId,
  	period: [
  		data.startTime,
  		data.endTime
    ],
    token: data.token
  };
  return axios.post("/api/data/retrieve", body);
}

export function apiDataTransaction(data) {
  const body = {
    transaction_id: data.transactionId,
  	token: data.token
  };
  return axios.post("/api/data/transaction", body);
}
// =========================== Data =========================== //

// =========================== Freezer =========================== //
export function apiFreezerList(data) {
  const body = {
    branch_id: data.branch_id,
    token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/freezer/list", body);
}

export function apiFreezerInfo(data) {
  const body = {
    freezer_id: data.freezer_id,
    token: data.token
  };
  return axios.post("/api/freezer/info", body);
}

export function apiFreezerAdd(data) {
  const body = {
  	freezer: {
	    name: data.name,
	    branch_id: data.branch_id,
	    department_id: data.department_id,
	    location_id: "",
  		rule_template_ids: data.rule_template_ids,
  		sensor_ids:  [],
	    type_id: data.type_id,
	    status: 1,
	    alert_status: 100,
	    register_date: "",
	    update_timestamp: "",
      defrosting_duration: data.defrosting_duration,
      defrosting_enable: data.defrosting_enable,
      defrost:{
        enable: data.defrosting_enable,
        mode: data.defrost_mode,
        duration: data.defrosting_duration
      }
  	},
    token: data.token
  };
  return axios.post("/api/freezer/add", body);
}

export function apiFreezerUpdate(data) {
  const body = {
  	freezer: {
      freezer_id: data.freezer_id,
	    name: data.name,
	    branch_id: data.branch_id,
	    department_id: data.department_id,
  		rule_template_ids: data.rule_template_ids,
	    type_id: data.type_id,
      defrosting_duration: data.defrosting_duration,
      defrosting_enable: data.defrosting_enable,
      defrost:{
        enable: data.defrosting_enable,
        mode: data.defrost_mode,
        duration: data.defrosting_duration
      }
  	},
    token: data.token
  };
  return axios.post("/api/freezer/update", body);
}

export function apiFreezerDelete(data) {
  const body = {
    freezer_id: data.freezer_id,
  	token: data.token
  };
  return axios.post("/api/freezer/delete", body);
}

export function apiFreezerCount(data) {
  const body = {
    branch_ids: data.branch_ids,
  	token: data.token
  };
  return axios.post("/api/freezer/count", body);
}

export function apiFreezerPause(data) {
  const body = {
    freezer_id: data.freezer_id,
    period: data.period,
    reason: data.reason,
  	token: data.token
  };
  return axios.post("/api/freezer/pause", body);
}

export function apiFreezerResume(data) {
  const body = {
    freezer_id: data.freezer_id,
  	token: data.token
  };
  return axios.post("/api/freezer/resume", body);
}

export function apiFreezerAttach(data) {
  const body = {
    freezer_id: data.freezer_id,
    sensor_id: data.sensor_id,
  	token: data.token
  };
  return axios.post("/api/freezer/attach", body);
}

export function apiFreezerDetach(data) {
  const body = {
    freezer_id: data.freezer_id,
    sensor_id: data.sensor_id,
  	token: data.token
  };
  return axios.post("/api/freezer/detach", body);
}

export function apiFreezerHistory(data) {
  const body = {
    freezer_id: data.freezer_id,
    action: data.action,
    period: data.period,
  	token: data.token
  };
  return axios.post("/api/freezer/history", body);
}

export function apiFreezerPropertyList(data) {
  const body = {
  	freezer_id: data.freezer_id,
  	date: data.date || "2018/01/01",
  	range: data.range || "mm",
  	type: data.type,
  	token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/freezer/property/list", body);
}

export function apiFreezerPropertyAdd(data) {
  const body = {
  	freezer_id: data.freezer_id,
  	date: [data.date || "2018/01/01"],
  	range: data.range || "mm",
  	type: data.type,
  	data: data.data,
  	token: data.token
  };
  return axios.post("/api/freezer/property/add", body);
}

export function apiFreezerPropertyUpdate(data) {
  const body = {
  	property: {
      property_id: data.property_id,
    	date: [data.date || "2018/01/01"],
    	range: data.range || "mm",
    	type: data.type,
    	data: data.data
    },
  	token: data.token
  };
  return axios.post("/api/freezer/property/update", body);
}

export function apiFreezerPropertyDelete(data) {
  const body = {
    property_id: data.property_id,
  	token: data.token
  };
  return axios.post("/api/freezer/property/delete", body);
}

export function apiFreezerPropertyHistory(data) {
  const body = {
    freezer_id: data.freezer_id,
    action: data.action,
    period: data.period,
  	token: data.token
  };
  return axios.post("/api/freezer/property/history", body);
}
// =========================== Freezer =========================== //

// =========================== Sensor =========================== //
export function apiSensorList(data) {
  const body = {
    branch_id: data.branch_id,
    token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/sensor/list", body);
}

export function apiSensorCount(data) {
  const body = {
    branch_ids: data.branch_ids,
  	token: data.token
  };
  return axios.post("/api/sensor/count", body);
}

export function apiSensorUpdate(data) {
  const body = {
  	sensor: {
      sensor_id: data.sensor_id,
      name: data.name
  	},
  	token: data.token
  };
  return axios.post("/api/sensor/update", body);
}

export function apiSensorDelete(data) {
  const body = {
    sensor_id: data.sensor_id,
  	token: data.token
  };
  return axios.post("/api/sensor/delete", body);
}

export function apiSensorDeActivate(data) {
  const body = {
    sensor_id: data.sensor_id,
  	token: data.token
  };
  return axios.post("/api/sensor/deactivate", body);
}

export function apiSensorDisable(data) {
  const body = {
    sensor_id: data.sensor_id,
  	token: data.token
  };
  return axios.post("/api/sensor/disable", body);
}

export function apiSensorEnable(data) {
  const body = {
    sensor_id: data.sensor_id,
  	token: data.token
  };
  return axios.post("/api/sensor/enable", body);
}

export function apiSensorCalibrate(data) {
  const body = {
    sensor_id: data.sensor_id,
  	token: data.token
  };
  return axios.post("/api/sensor/calibrate", body);
}

export function apiSensorChangeType(data) {
  const body = {
    sensor_id: data.sensor_id,
    sensor_type: data.sensor_type,
  	token: data.token
  };
  return axios.post("/api/sensor/changetype", body);
}
// =========================== Sensor =========================== //
// =========================== Sensor Calibration=========================== //
export function apiSensorCalibrationAdd(data) {
  const body = {
    sensor_id: data.sensor_id,
    calibration:{
      sensor_id: data.sensor_id,
      adjustment:data.adjustment,
      qualified:data.qualified,
      descr:data.descr
    },
  	token: data.token
  };
  return axios.post("/api/sensor/calibration/add", body);
}
export function apiSensorCalibrationListBySensors(data) {
  const body = {
    sensor_ids: data.sensor_ids,
  	token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/sensor/calibration/list", body);
}
export function apiSensorCalibrationConfirmBySensor(data) {
  const body = {
    sensor_id: data.sensor_id,
  	token: data.token
  };
  return axios.post("/api/sensor/calibration/confirm", body);
}
// =========================== Sensor Calibration =========================== //
// =========================== Gateway =========================== //
export function apiGatewayListByBranch(data) {
  const body = {
    branch_id: data.branch_id,
    token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/gateway/list", body);
}

export function apiGatewayUpdate(data) {
  const body = {
  	gateway: {
      gateway_id: data.gateway_id,
      name: data.name,
      description: data.description
  	},
  	token: data.token
  };
  return axios.post("/api/gateway/update", body);
}

export function apiGatewayDeActivate(data) {
  const body = {
    gateway_id: data.gateway_id,
  	token: data.token
  };
  return axios.post("/api/gateway/deactivate", body);
}

export function apiGatewayEnable(data) {
  const body = {
    gateway_id: data.gateway_id,
  	token: data.token
  };
  return axios.post("/api/gateway/enable", body);
}

export function apiGatewayDisable(data) {
  const body = {
    gateway_id: data.gateway_id,
  	token: data.token
  };
  return axios.post("/api/gateway/disable", body);
}

export function apiGatewayDelete(data) {
  const body = {
    gateway_id: data.gateway_id,
  	token: data.token
  };
  return axios.post("/api/gateway/delete", body);
}
// =========================== Gateway =========================== //

// =========================== Role =========================== //
export function apiRoleAuthorityInfo(data) {
  const body = {
    role_id: data.role_id,
    token: data.token
  };
  return axios.post("/api/role/authority_info", body);
}
export function apiRoleList(token) {
  const body = {
    token: token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/role/list", body);
}
export function apiRoleUpdate(data) {
  const body = {
    role_id: data.role_id,
    auth_info:data.auth_info,
  	token: data.token
  };
  return axios.post("/api/role/authority_update", body);
}
// =========================== Role =========================== //

// =========================== User =========================== //
export function apiUserList(data) {
  const body = {
    user_ids:data.user_ids,
    token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/user/list", body);
}
export function apiUserImport(data) {
  const body = {
    add:data.add,
    update:data.update,
    delete:data.delete,
    token: data.token
  };
  return axios.post("/api/user/import", body);
}
export function apiUserAdd(data) {
  const body = {
    email: data.user.email,
    user_account: data.user.user_account,
    name: data.user.name,
    department: data.user.department,
    position: data.user.position,
    role_id: data.user.role_id,
    branch_ids: data.user.branch_ids,
    region_ids:data.user.region_ids,
    acc_id:data.user.acc_id,
    landphone: data.user.landphone,
    cellphone: data.user.cellphone,
    descr: data.user.descr,
    branch_type_ids:data.user.branch_type_ids,
    code:data.user.code,
    token: data.token
  };
  return axios.post("/api/user/add", body);
}
export function apiUserUpdate(data) {
  const body = {
    user:data.user,
    token: data.token
  };
  return axios.post("/api/user/update", body);
}
export function apiUserDelete(data) {
  const body = {
    user_id:data.user_id,
    token: data.token
  };
  return axios.post("/api/user/delete", body);
}
export function apiUserInfo(data) {
  const body = {
    user_id:data.user_id,
    token: data.token
  };
  return axios.post("/api/user/info", body);
}
export function apiUserChangepwd(data) {
  const body = {
    user_id:data.user_id,
    new_password:data.new_password,
    token: data.token
  };
  return axios.post("/api/user/changepwd", body);
}
// =========================== User =========================== //

// =========================== rule_template =========================== //
export function apiRuleTemplateList(data) {
  const body = {
    acc_id:data.acc_id,
    token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/rule_template/list", body);
}

export function apiRuleTemplateAdd(data) {
  const body = {
    rule_template:data.rule_template,
    token: data.token
  };
  return axios.post("/api/rule_template/add", body);
}

export function apiRuleTemplateUpdate(data) {
  const body = {
    rule_template:data.rule_template,
    token: data.token
  };
  return axios.post("/api/rule_template/update", body);
}

export function apiRuleTemplateDelete(data) {
  const body = {
    rule_template_id:data.id,
    token: data.token
  };
  return axios.post("/api/rule_template/delete", body);
}
// =========================== rule_template =========================== //

// =========================== rule_template Monitor=========================== //
export function apiRuleTemplateMonitorList(data) {
  const body = {
    acc_id:data.acc_id,
    token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/rule_template/monitor/list", body);
}

export function apiRuleTemplateMonitorAdd(data) {
  const body = {
    monitor_rule:data.monitor_rule,
    token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/rule_template/monitor/add", body);
}
// =========================== rule_template Monitor=========================== //

// =========================== rule_template Alert=========================== //
export function apiRuleTemplateAlertList(data) {
  const body = {
    acc_id:data.acc_id,
    token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/rule_template/alert/list", body);
}
export function apiRuleTemplateAlertUpdate(data) {
  const body = {
    alert_rule:data.alert_rule,
    token: data.token
  };
  return axios.post("/api/rule_template/alert/update", body);
}
// =========================== rule_template Alert=========================== //

// =========================== Schedule task =========================== //
export function apiScheduleList(data) {
  const body = {
    branch_id:data.branch_id,
    token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/task/list", body);
}
export function apiScheduleAdd(data) {
  const body = {
    task:data.task,
    token: data.token
  };
  return axios.post("/api/task/add", body);
}
export function apiScheduleInfo(data) {
  const body = {
    task_id:data.task_id,
    token: data.token
  };
  return axios.post("/api/task/info", body);
}
export function apiScheduleUpdate(data) {
  const body = {
    task:data.task,
    token: data.token
  };
  return axios.post("/api/task/update", body);
}
export function apiScheduleDelete(data) {
  const body = {
    task_id:data.task_id,
    token: data.token
  };
  return axios.post("/api/task/delete", body);
}
// =========================== Schedule task =========================== //

// =========================== alert_record=========================== //
export function apiAlertRecordList(data) {
  const body = {
    branch_id:data.branch_id,
    monitor_item:data.monitor_item,
    period:data.period,
    token: data.token,
    cancelToken:  new CancelToken(c => (apiCancelList.push(c)))
  };
  return axios.post("/api/alert_record/list", body);
}
export function apiAlertRecordInfo(data) {
  const body = {
    alert_id:data.alert_id,
    token: data.token
  };
  return axios.post("/api/alert_record/info", body);
}
export function apiAlertRecordAdd(data) {
  const body = {
    alert_id:data.alert_id,
    content_type: data.content_type,
    content: data.content,
    token: data.token
  };
  return axios.post("/api/alert_record/add", body);
}
// =========================== alert_record=========================== //

// =========================== report =========================== //
export function apiGetReportList() {
  return axios.get("https://support.ushop-plus.com/ccm/getfile");
}
// =========================== report=========================== //
