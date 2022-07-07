import logo from './logo-96.png'
import layers from './layered-waves-haikei.png'

export default function Header() {
    return (
        <header>
            <img style={{
                all: 'unset',
                position: 'absolute',
                zIndex: -1,
                width: '100vw',
                height: '20vh'
            }}
            src={layers} />
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 'auto',
                paddingTop: '10vh'
            }}>
                <h1>TRIMEDX Watercoolr</h1>
                <img src={logo}/>
            </div>
        </header>
    )
}