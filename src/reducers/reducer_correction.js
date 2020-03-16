import _ from "lodash";
import { SET_CORRECTION } from "../actions";

export default function(state = {}, action) {
  switch (action.type) {
    case SET_CORRECTION:
      return action.payload;
    default:
      return state;
  }
}
