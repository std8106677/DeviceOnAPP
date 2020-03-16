import _ from "lodash";
import { SET_TEMP } from "../actions";

export default function(state = {}, action) {
  switch (action.type) {
    case SET_TEMP:
      return action.payload;
    default:
      return state;
  }
}
