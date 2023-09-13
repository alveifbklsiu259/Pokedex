import { useSelector, useDispatch, type TypedUseSelectorHook } from "react-redux";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch: () => AppDispatch = useDispatch;
// useAppSelector will almost never be used, since I declare all selector in slice files, instead of each component, when we import the selector to component, it already has the correct type.
/*  edit: no, we're still gonna use it, if we need to get access to the state, e.g.
	const a = useSelector(state => selectXXX)
	in this case, state would be unknown
*/
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const createAppAsyncThunk =  createAsyncThunk.withTypes<{
	state: RootState,
	dispatch: AppDispatch,
	rejectValue: string
}>();