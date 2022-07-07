import React, { useEffect, useState } from 'react';
import { AzureAD, AuthenticationState } from 'react-aad-msal';
import { basicReduxStore } from './reduxStore';

// Import the authentication provider which holds the default settings
import { authProvider } from './authProvider';

import SampleAppButtonLaunch from './SampleAppButtonLaunch';

import './App.css';
import Header from './Header';

function App() {

  const [isRegistered, setIsRegistered] = useState(null);
  const [auth, setAuth] = useState(null)
  const [account, setAccount] = useState(null)

  const reg = async () => {
    console.log("HERE!!!")
    if (auth === AuthenticationState.Authenticated && account) {
      const res = await getIsRegistered(account.userName);
      console.log(res)
      setIsRegistered(res)
    }
  }

  basicReduxStore.subscribe(() => {
    if (basicReduxStore.getState()) {
      const state = basicReduxStore.getState()
      if (state.state)
        setAuth(state.state)
        
      if (state.account)
        setAccount(state.account)

      // if (isRegistered === null && state.state !== AuthenticationState.InProgress)
      //   reg()
    }
  })

  useEffect(() => {
    if (isRegistered === null)
      reg()
  }, [auth, account])

  const sampleBox = (
    <div className="SampleBox">
      <h2 className="SampleHeader">Button Login</h2>
      <p>This example will launch a popup dialog to allow for authentication with Azure Active Directory</p>
      <SampleAppButtonLaunch />
    </div>
  );

  const handleGetCalendar = async () => {
    const token = await authProvider.getAccessToken();
    const res = await fetch("https://graph.microsoft.com/v1.0/me/calendar/getSchedule",
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token.accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedules: ["chris.alexeev@trimedx.com","drew.hansen@trimedx.com"],
          startTime: {
              dateTime: "2022-07-06T09:00:00",
              timeZone: "Eastern Standard Time"
          },
          endTime: {
              dateTime: "2022-07-06T18:00:00",
              timeZone: "Eastern Standard Time"
          },
          availabilityViewInterval: 30
        })
      }
    );
    console.log(await res.json())
  }

  const handleRegister = async () => {
    const res = await fetch(
      process.env.REACT_APP_API_ENDPOINT,
      {
        method: "POST",
        body: JSON.stringify(
          {
            email: account.userName,
            name: account.name
          }
        )
      }
    )

    console.log(await res.json())

    await reg();
  }

  const getIsRegistered = async email => {
    const res = await fetch(
      process.env.REACT_APP_API_ENDPOINT
    )
  
    const users = await res.json()
    console.log(users)
    return users.some(u => u && u.RowKey.toLowerCase() === email.toLowerCase())
  }

  return (
    <div>
      <Header />
      <AzureAD provider={authProvider} reduxStore={basicReduxStore}>
          {({ accountInfo, authenticationState, error }) => {

            const unregistered =  (
              <button onClick={handleRegister} className='Button'>
                Register
              </button>
            )

            const loggedInAndRegistered = (
              <>
                <button onClick={handleGetCalendar} className="Button">
                  Get Calendar
                </button>
              </>
            )

            return (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {auth === AuthenticationState.Authenticated && !isRegistered && unregistered}
                {auth === AuthenticationState.Authenticated && isRegistered && loggedInAndRegistered}
                <SampleAppButtonLaunch />
              </div>
            );
          }}
        </AzureAD>
    </div>
  )
}

export default App;