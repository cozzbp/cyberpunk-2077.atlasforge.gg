import React, { createContext, useState, useReducer } from "react"
import toast, { Toaster } from 'react-hot-toast';
import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

export const AppContext = createContext(undefined);

const initialState = {
  token: '',
  is_premium: false,
  logged_in: false,
  is_loading: true,
}


export const checkLogin = async () => {
  const value = await Preferences.get({ key: `login` })
  const token = value?.value

  const valPrem = await Preferences.get({ key: `is_premium` })
  const is_premium = (valPrem?.value === 'true')

  if (!token) {
    return {
      logged_in: false,
      token: '',
      is_premium: false,
      is_loading: false,
    }
  }

  return {
    logged_in: true,
    token: token,
    is_premium: is_premium,
    is_loading: false,
  }
}

const reducer = (state, action) => {
  switch (action.type) {
    case "RECEIVE_LOGIN":
      return {
        ...state,
        logged_in: action.payload.logged_in,
        token: action.payload.token,
        is_premium: action.payload.is_premium,
        is_loading: false,
      };
  }
};

export const AppContextProvider = props => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={[state, dispatch]}>
      {props.children}
    </AppContext.Provider>
  );
};