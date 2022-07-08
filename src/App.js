import React, { useEffect, useState } from 'react';
import LoadingIcons from 'react-loading-icons'
import { AzureAD, AuthenticationState } from 'react-aad-msal';
import { basicReduxStore } from './reduxStore';

// Import the authentication provider which holds the default settings
import { authProvider } from './authProvider';

import SampleAppButtonLaunch from './SampleAppButtonLaunch';

import './App.css';
import Header from './Header';
import { formatName, pairUp, shuffle } from './utils';

function App() {

  const [isRegistered, setIsRegistered] = useState(null);
  const [auth, setAuth] = useState(null)
  const [account, setAccount] = useState(null)
  const [users, setUsers] = useState(null)
  const [isShuffling, setIsShuffling] = useState(false)
  const [groups, setGroups] = useState(null)

  const reg = async () => {
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
    }
  })

  useEffect(() => {
    if (isRegistered === null)
      reg()
    if (auth === AuthenticationState.Authenticated)
      getUsers().then(users => setUsers(users))
  }, [auth, account])

  const getStartDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(0)
    d.setMinutes(0)
    return d
  }

  const getEndDate = startDate => {
    const d = new Date(JSON.parse(JSON.stringify(startDate)))
    d.setMonth(d.getMonth() + 1)
    return d
  }

  const findMeetingTimes = async userGroup => {
    const startDate = getStartDate()
    const endDate = getEndDate(startDate)
    const token = await authProvider.getAccessToken();
    const res = await fetch("https://graph.microsoft.com/v1.0/me/findMeetingTimes",
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token.accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "attendees": userGroup.map(user => {
            return {
              "emailAddress": {
                "address": user.RowKey,
              },
              "type": "Required"
            } 
          }),
          "minimumAttendeePercentage": 100,
          "timeConstraint": {
              "timeslots": [
                  {
                      "start": {
                          "dateTime": startDate,
                          "timeZone": "Eastern Standard Time"
                      },
                      "end": {
                          "dateTime": endDate,
                          "timeZone": "Eastern Standard Time"
                      }
                  }
              ]
          },
          "isOrganizerOptional": true,
          "meetingDuration": "PT30M"
        })
      }
    );
    return await res.json()
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

  const scheduleMeeting = async (group, time) => {
    const tokenRes = await authProvider.getAccessToken()
    const token = tokenRes.accessToken
    console.log(token)
    const res = await fetch(
      "https://graph.microsoft.com/v1.0/me/events",
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
          "subject": "Watercoolr Chat",
          "body": {
            "contentType": "HTML",
            "content": "Get to know your coworkers with TMX Watercoolr!"
          },
          "start": time.meetingTimeSlot.start,
          "end": time.meetingTimeSlot.end,
          "attendees": group.map(user => {
            return {
              "emailAddress": {
                "address": user.RowKey,
              },
              "type": "Required"
            } 
          }),
          "isOnlineMeeting": true,
          "allowNewTimeProposals": true
        })
      }
    )

    const resJson = await res.json()

    return resJson
      
  }

  const handleShuffle = async () => {
    setIsShuffling(true)
    const results = []
    const shuffledUsers = shuffle(users)
    const groups = pairUp(shuffledUsers)
    setGroups(groups)

    console.log(groups)

    for (let group of groups) {
      const res = await findMeetingTimes(group)
      // console.log(resJson)
      const times = res.meetingTimeSuggestions
      const timeIndex = Math.floor(Math.random() * times.length)
      results.push(await scheduleMeeting(group, times[timeIndex]))
      // results.push([group, times[timeIndex]])
    }

    setIsShuffling(false)
    console.log(results)

    return results
  }

  const getIsRegistered = async email => {
    const users = await getUsers();
    console.log(users)
    return users.some(u => u && u.RowKey.toLowerCase() === email.toLowerCase())
  }

  const getUsers = async () => {
    const res = await fetch(
      process.env.REACT_APP_API_ENDPOINT
    );
  
    const users = await res.json();
    return users;
  }

  const loader = (
    <div style={{
      position: 'absolute',
      top: '48vh',
      left: '48vw',
      zIndex: 100
    }}>
      <LoadingIcons.TailSpin stroke='#00a1f1' />
    </div>
  )


  return (
    <div>
      <Header />
      <AzureAD provider={authProvider} reduxStore={basicReduxStore}>
          {({ accountInfo, authenticationState, error }) => {

            const isAuthenticated = auth === AuthenticationState.Authenticated

            const isAdmin = accountInfo && accountInfo.account.accountIdentifier === process.env.REACT_APP_ADMIN_ID

            const adminPanel = (
              <>
                {isShuffling && loader}
                <ul>
                  {users && !groups && users.map(u => {
                    return <li key={Math.floor(Math.random() * 100000)}>{formatName(u.name)}</li>
                  })}
                  {groups && groups.map(g => {
                    return <li key={Math.floor(Math.random() * 100000)}>{g.map(u => formatName(u.name)).join(' & ')}</li>
                  })}
                </ul>
                <button onClick={handleShuffle} className='Button' disabled={isShuffling}>
                  Shuffle!
                </button>
              </>
            )

            const unregistered =  (
              <button onClick={handleRegister} className='Button'>
                Register
              </button>
            )

            const loggedInAndRegistered = (
              <>
                {users && <p>There {users.length === 1 ? 'is 1 person' : `are ${users.length} people`} by the watercoolr.</p>}
              </>
            )

            return (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isAuthenticated && isRegistered === false && unregistered}
                {isAuthenticated && isRegistered && loggedInAndRegistered}
                {isAuthenticated && isRegistered && isAdmin && adminPanel}
                <div style={{
                  height: 20
                }}/>
                <SampleAppButtonLaunch />
              </div>
            );
          }}
        </AzureAD>
    </div>
  )
}

export default App;
