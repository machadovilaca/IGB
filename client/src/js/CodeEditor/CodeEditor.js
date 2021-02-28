import React, { useEffect, useState, useRef } from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/javascript";

import "./CodeEditor.css";
import { fileOpen, fileSave } from "browser-fs-access";
import CanvasDraw from "react-canvas-draw";
import { GithubPicker } from "react-color";

function CodeEditor(props) {
  const [code, setCode] = useState("");
  const socket = props.socket;
  const [blob, setBlob] = useState(null);
  const [useCanvas, setUseCanvas] = useState(true);
  const clientId = props.clientId;
  const canvasRef = useRef(null);
  const [canvasColor, setCanvasColor] = useState("#ffffff");
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [canvasData, setCanvasData] = useState({
    data: null,
    userChange: false,
  });

  socket
    .on("file", (data) => {
      setCode(data.data);
    })
    .on("canvas", (data) => {
      if (data.to === clientId) {
        setCanvasData({ data: data.data, userChange: true });
      }
    });

  useEffect(() => {
    if (canvasData.userChange) {
      canvasRef.current.loadSaveData(canvasData.data, true);

      if (JSON.parse(canvasData.data).lines.length === 0) {
        setCanvasData({ userChange: false });
      }
    }
  }, [canvasData.userChange]);

  const openFile = async () => {
    const blob = await fileOpen();

    const reader = new FileReader();
    reader.onload = async (e) => {
      setCode(e.target.result);
      props.inputchange(e.target.result);
    };

    setBlob(blob);

    reader.readAsText(blob);
  };

  const saveFile = () => {
    var newBlob = new Blob([code], {
      type: "text/plain",
    });
    const handle = blob.handle;
    fileSave(newBlob, {}, handle);
  };

  const updateEditor = (codeUpdate) => {
    setCode(codeUpdate);
    props.inputchange(codeUpdate);
  };

  const closeFile = () => {
    props.inputchange("");
    setCode("");
    setBlob(null);
  };

  const updateCanvas = (canvas) => {
    if (!canvasData.userChange) {
      props.canvasinputchange(canvas.getSaveData());
    } else {
      setCanvasData({ userChange: false });
    }
  };

  const cleanCanvas = () => {
    canvasRef.current.clear();
    updateCanvas(canvasRef.current);
  };

  const changeTop = () => {
    setUseCanvas(!useCanvas);
  };

  const changeCanvasColor = (color) => {
    setCanvasColor(color.hex);
    setDisplayColorPicker(false);
  };

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const popover = {
    position: "absolute",
    zIndex: "20",
  };

  const cover = {
    position: "fixed",
    top: "0px",
    right: "0px",
    bottom: "0px",
    left: "0px",
  };

  return (
    <div>
      <div className="buttons">
        {blob ? <button onClick={(e) => saveFile(e)}>Save file</button> : ""}
        <button type="file" onClick={openFile}>
          Select file
        </button>
        {blob ? <button onClick={(e) => closeFile()}>Close file</button> : ""}
      </div>
      <div className="buttons">
        {code ? (
          <>
            <button onClick={(e) => changeTop()}>
              {useCanvas ? "Write code" : "Draw"}
            </button>
            <button onClick={(e) => cleanCanvas()}>Clear drawings</button>
            <div>
              <button onClick={handleClick}>Pick Color</button>
              {displayColorPicker ? (
                <div style={popover}>
                  <div style={cover} onClick={handleClose} />
                  <GithubPicker
                    color={canvasColor}
                    onChangeComplete={changeCanvasColor}
                  />
                </div>
              ) : null}
            </div>
          </>
        ) : (
          ""
        )}
      </div>
      <div className="iteractive">
        {code ? (
          <div className={"canvas" + (useCanvas ? " top" : "")}>
            <CanvasDraw
              gridColor="none"
              backgroundColor="none"
              ref={canvasRef}
              onChange={updateCanvas}
              hideGrid={true}
              canvasWidth={1200}
              canvasHeight={600}
              brushRadius={3}
              brushColor={canvasColor}
            />
          </div>
        ) : (
          ""
        )}
        <div className={"code-editor" + (useCanvas ? "" : " top")}>
          <AceEditor
            mode="javascript"
            theme="monokai"
            onChange={updateEditor}
            fontSize={18}
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={true}
            value={code}
            height="600px"
            width="1200px"
            enableBasicAutocompletion={true}
            enableLiveAutocompletion={true}
            enableSnippets={true}
          />
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;
