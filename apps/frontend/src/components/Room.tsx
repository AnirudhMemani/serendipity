import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import ActionButton from "./ActionButton";

const URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack,
    location,
}: {
    name: string;
    localAudioTrack: MediaStreamTrack | null;
    localVideoTrack: MediaStreamTrack | null;
    location: string;
}) => {
    const [lobby, setLobby] = useState(true);
    const [_socket, setSocket] = useState<null | Socket>(null);
    const [_sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [_receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null);
    const [_remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [_remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [isMuted, setIsMuted] = useState<boolean>(false);

    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const socket = io(URL);

        socket.on("send-offer", async ({ roomId }) => {
            console.log("sending offer");

            setLobby(false);

            const pc = new RTCPeerConnection();

            pc.onicecandidate = async (e) => {
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "sender",
                        roomId,
                    });
                }
            };

            pc.onnegotiationneeded = async () => {
                const sdp = await pc.createOffer();
                await pc.setLocalDescription(sdp);
                setSendingPc(pc);
                socket.emit("offer", {
                    sdp,
                    roomId,
                });
            };

            if (localVideoTrack) {
                pc.addTrack(localVideoTrack);
            }

            if (localAudioTrack) {
                pc.addTrack(localAudioTrack);
            }
        });

        socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
            console.log("received offer");

            setLobby(false);

            const pc = new RTCPeerConnection();

            pc.ontrack = (event: RTCTrackEvent) => {
                if (remoteVideoRef.current) {
                    const track = event.track;
                    const remoteVideo = remoteVideoRef.current;

                    // Check track kind instead of event.type
                    if (track.kind === "audio") {
                        setRemoteAudioTrack(track);
                    } else if (track.kind === "video") {
                        setRemoteVideoTrack(track);
                    }

                    // Create or update the MediaStream
                    if (!remoteVideo.srcObject) {
                        remoteVideo.srcObject = new MediaStream();
                    }

                    // Add the track to the existing MediaStream
                    (remoteVideo.srcObject as MediaStream).addTrack(track);

                    remoteVideo.play().catch(console.error);
                }
            };

            pc.onicecandidate = async (e) => {
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "receiver",
                        roomId,
                    });
                }
            };

            await pc.setRemoteDescription(remoteSdp);
            const sdp = await pc.createAnswer();
            await pc.setLocalDescription(sdp);

            setReceivingPc(pc);

            socket.emit("answer", {
                roomId,
                sdp: sdp,
            });
        });

        socket.on("answer", ({ sdp: remoteSdp }) => {
            setLobby(false);

            setSendingPc((pc) => {
                pc?.setRemoteDescription(remoteSdp);
                return pc;
            });
        });

        socket.on("lobby", () => {
            setLobby(true);
        });

        socket.on("add-ice-candidate", ({ candidate, type }) => {
            if (type == "sender") {
                setReceivingPc((pc) => {
                    pc?.addIceCandidate(candidate);
                    return pc;
                });
            } else {
                setSendingPc((pc) => {
                    pc?.addIceCandidate(candidate);
                    return pc;
                });
            }
        });

        setSocket(socket);
    }, [name]);

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play();
            }
        }
    }, [localVideoRef]);

    return (
        <div className="flex h-[90dvh] w-full justify-center">
            <div className="flex w-[96%] gap-1">
                <div className="flex flex-1 flex-col">
                    <video autoPlay ref={localVideoRef} className="h-[60%] w-full object-fill" />
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="flex h-[70%] w-full items-center justify-around gap-4 px-4">
                            <ActionButton
                                title={"Next"}
                                className="bg-[#50b58d] shadow-[0_9px_rgba(67,_169,_128,_1)] active:shadow-[0_5px_rgba(67,_169,_128,_0.8)]"
                            />
                            <ActionButton
                                title="stop"
                                className="bg-[#f2b29f] shadow-[0_9px_rgba(226,_95,_55,_0.8)] active:shadow-[0_5px_rgba(226,_95,_55,_1)]"
                            />
                            <ActionButton
                                title={`Country: ${location}`}
                                className="bg-white shadow-[0_9px_rgba(30,_58,_138,_0.8)] active:shadow-[0_5px_rgba(30,_58,_138,_1)] dark:bg-blue-700"
                            />
                            <ActionButton
                                title={isMuted ? "unmute" : "mute"}
                                className="bg-white shadow-[0_9px_rgba(30,_58,_138,_0.8)] active:shadow-[0_5px_rgba(30,_58,_138,_1)] dark:bg-blue-700"
                                onClick={() => {
                                    if (localAudioTrack) {
                                        localAudioTrack.enabled = !isMuted;
                                        setIsMuted((p) => !p);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                {lobby ? (
                    <div className="flex flex-1 items-center justify-center">
                        <p>Waiting to connect you to someone</p>
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col">
                        <video autoPlay ref={remoteVideoRef} className="h-[60%] w-full object-fill" />
                        <div className="flex w-full flex-grow flex-col rounded-b-lg shadow-[rgba(0,_0,_0,_0.24)_0px_3px_8px] dark:shadow-[rgba(255,_255,_255,_0.24)_0px_3px_8px]">
                            <p className="flex-grow"></p>
                            <input
                                type="text"
                                placeholder={`Chat with user2`}
                                className="border-input w-full border-t bg-transparent p-2 outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
