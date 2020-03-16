import _ from "lodash";
import { SET_STOREDEPARTMENT } from "../actions";

export default function(state = [], action) {
  switch (action.type) {
    case SET_STOREDEPARTMENT:
      return action.payload;
    default:
      return state;
  }
}
