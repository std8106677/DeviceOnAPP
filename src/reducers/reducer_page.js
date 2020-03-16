import _ from "lodash";
import { SET_PAGE} from "../actions";

export default function(state = "", action) {
  switch (action.type) {
    case SET_PAGE:
      return action.payload;
    default:
      return state;
  }
}
