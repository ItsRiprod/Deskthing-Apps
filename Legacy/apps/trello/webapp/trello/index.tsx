/* eslint-disable @typescript-eslint/no-explicit-any */
import './Trello.css';
import React, { useEffect, useState } from 'react';
import socket, { socketData } from '../../helpers/WebSocketService';
import Organizations from './Organizations';
import Boards from './Boards';
import Cards from './Cards';
import Lists from './Lists';
import { IconCollection, IconHome } from '../../components/todothingUIcomponents';

export type defaultProps = {
  handleSendGet: (type: string, get: string, payload: any) => void;
  data: any;
};

function Default({ handleSendGet, data }: defaultProps) {
  const handleClick = (tarId: string, name: string) => {
    handleSendGet('set', 'trello_remove_list_pref', { id: tarId, name: name });
    handleSendGet('get', 'trello_pref_info', '');
  };

  return (
    <div className="trello_default">
        <div className="trello_default_shortcuts">
          {data &&
            data.map((list: any) => (
              <div key={list.id} className="trello_default_shortcut_item">
                <button
                  onClick={() => handleSendGet('get', 'cards_from_list', { id: list.id })}
                  className="list_content"
                >
                  <h1>{list.name}</h1>
                </button>
                <button className="board_starred" onClick={() => handleClick(list.id, list.name)}>
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule={'inherit'}
                      clipRule="evenodd"
                      d="M24 16.5191L22.4994 19.5596C22.0625 20.445 21.2178 21.0587 20.2406 21.2007L16.8853 21.6882L19.3132 24.0549C20.0203 24.7441 20.3429 25.7371 20.176 26.7103L19.6028 30.0521L22.604 28.4744C23.478 28.0149 24.5221 28.0149 25.396 28.4744L28.3972 30.0521L27.824 26.7103C27.6571 25.7371 27.9797 24.7441 28.6868 24.0549L31.1148 21.6882L27.7594 21.2007C26.7823 21.0587 25.9376 20.445 25.5006 19.5596L24 16.5191ZM24.8967 13.817C24.5299 13.0737 23.4701 13.0737 23.1033 13.817L20.706 18.6744C20.5603 18.9696 20.2787 19.1741 19.953 19.2215L14.5925 20.0004C13.7723 20.1196 13.4448 21.1276 14.0383 21.7061L17.9172 25.4871C18.1529 25.7168 18.2604 26.0478 18.2048 26.3722L17.2891 31.7111C17.149 32.528 18.0064 33.151 18.7401 32.7653L23.5347 30.2446C23.826 30.0915 24.174 30.0915 24.4653 30.2446L29.26 32.7653C29.9936 33.151 30.851 32.528 30.7109 31.7111L29.7952 26.3722C29.7396 26.0478 29.8471 25.7168 30.0828 25.4871L33.9617 21.7061C34.5553 21.1276 34.2277 20.1196 33.4075 20.0004L28.047 19.2215C27.7213 19.1741 27.4397 18.9696 27.294 18.6744L24.8967 13.817Z"
                      fill={'gold'}
                    />
                  </svg>
                </button>
              </div>
            ))}
        </div>
        <div className="trello_default_get_boards">
          <h1>Trello</h1>
          <button onClick={() => handleSendGet('get', 'org_info', null)}>
            <IconCollection />
          </button>
        </div>

    </div>
  );
}

const Trello: React.FC = () => {
  const [data, setData] = useState<any>();
  const [pref, setPref] = useState<any>();
  const handleTrelloData = (data: socketData) => {
    try {
      const formattedData = JSON.parse(typeof data.data === 'string' && data.data);
      const finalData = {
        data: formattedData,
        type: data.type,
      };

      setData(finalData);
      //console.log('Data:', finalData);
    } catch (error) {
      console.error('Error parsing trello data:', error);
    }
  };
  const handleTrelloPref = (data: socketData) => {
    try {
      const formattedData = data.data.lists;

      setPref(formattedData);
    } catch (error) {
      console.error('Error parsing trello data:', error);
    }
  };
  const handleTrelloLabel = (newData: socketData) => {
    try {
      const formattedData = JSON.parse(typeof newData.data === 'string' && newData.data);
      setData((prevData: any) => ({
        ...prevData,
        labels: formattedData,
      }));
    } catch (error) {
      console.error('Error parsing trello data:', error);
    }
  };

  useEffect(() => {
    handleSendGet('get', 'trello_pref_info', '');
    const listener = (msg: socketData) => {
      if (msg.type.startsWith('trello_')) {
        switch (msg.type) {
          case 'trello_board_data':
          case 'trello_card_data':
          case 'trello_list_data':
          case 'trello_org_data':
            handleTrelloData(msg);
            break;
          case 'trello_label_data':
            handleTrelloLabel(msg);
            break;
          case 'trello_pref_data':
            handleTrelloPref(msg);
            break;
        }
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSendGet = (type: string, request: string, payload: any) => {
    if (socket.is_ready()) {
      const data = {
        app: 'trello',
        type: type,
        request: request,
        data: payload,
      };
      socket.post(data);
    }
  };

  const renderView = () => {
    switch (data?.type || null) {
      case 'trello_org_data':
        return <Organizations data={data.data} handleSendGet={handleSendGet} />;
      case 'trello_board_data':
        return <Boards data={data.data} handleSendGet={handleSendGet} />;
      case 'trello_card_data':
        return <Cards data={data} handleSendGet={handleSendGet} />;
      case 'trello_list_data':
        return <Lists data={data.data} prefLists={pref} handleSendGet={handleSendGet} />;
      case 'default':
      default:
        return <Default data={pref} handleSendGet={handleSendGet} />;
    }
  };
  return (
    <div className="view_trello">
      <button
        className="back_button"
        onClick={() => {
          setData(null);
          handleSendGet('get', 'trello_pref_info', '');
        }}
      >
        <IconHome />
      </button>
      <div>{renderView()}</div>
    </div>
  );
};

export default Trello;
