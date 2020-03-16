import _ from "lodash";
import { SET_POSITION } from "../actions";

export default function(state = {}, action) {
  switch (action.type) {
    case SET_POSITION:
      return action.payload;
    default:
      return state;
  }
}
