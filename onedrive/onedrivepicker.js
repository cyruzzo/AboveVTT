   const msalParams = {
        auth: {
            authority: "https://login.microsoftonline.com/consumers",
            clientId: "8daaa51f-de45-4803-92c3-f4b11dbf8b42",
            redirectUri: "https://www.dndbeyond.com"
        },
    }

    const app = new msal.PublicClientApplication(msalParams);



    async function getToken(scopesArray = ["onedrive.readwrite"]) {

        let accessToken = "";

        authParams = { scopes: scopesArray };

        try {

            // see if we have already the idtoken saved
            const resp = await app.acquireTokenSilent(authParams);
            accessToken = resp.accessToken;



        } catch (e) {

            // per examples we fall back to popup
            const resp = await app.loginPopup(authParams);
            app.setActiveAccount(resp.account);

            if (resp.idToken) {
                const resp2 = await app.acquireTokenSilent(authParams);
                accessToken = resp2.accessToken;
            }
        }

        return accessToken;
    }

    async function getEmbedToken(scopesArray = ["files.readwrite"]) {

        let accessToken = "";

        authParams = { scopes: scopesArray };


        // per examples we fall back to popup
        const resp = await app.loginPopup(authParams);
        app.setActiveAccount(resp.account);

        if (resp.idToken) {
            const resp2 = await app.acquireTokenSilent(authParams);
            accessToken = resp2.accessToken;
        }
        

        return accessToken;
    }
    const oneDriveBaseUrl = "https://onedrive.live.com/picker";



    let win = null;
    let port = null;
    async function getEmbedLink(fileid, embedToken){
        let embedData = null;
  
        await $.ajax({
            url: `https://graph.microsoft.com/v1.0/me/drive/items/${fileid}/createLink`,
            type: 'post',
            data: "{type: 'view'}",
            scope: 'anonymous',
            headers: {
                'Authorization': `Bearer ${embedToken}`,   //If your header name has spaces or any other char not appropriate
                "Content-Type": 'application/json',  //for object property name, use quoted notation shown in second,
            },
            success: function (data) {
                console.info(data);
                embedData = data;
            }
        });
        if(embedData.link.webUrl.split('/')[4].length == 1){
            await $.ajax({
                url: `https://graph.microsoft.com/v1.0/me/drive/items/${fileid}/createLink`,
                type: 'post',
                data: "{type: 'embed'}",
                scope: 'anonymous',
                headers: {
                    'Authorization': `Bearer ${embedToken}`,   //If your header name has spaces or any other char not appropriate
                    "Content-Type": 'application/json',  //for object property name, use quoted notation shown in second,
                },
                success: function (data) {
                    console.info(data);
                    embedData = data;
                }
            });
        }
        
        return embedData.link.webUrl
    }    
    async function launchPicker(e, callback=function(){}, selectionMode, selectionType) {

        e.preventDefault();
        // the options we pass to the picker page through the querystring
        const channelId = uuid();
        let params = {
            sdk: "8.0",
            entry: {
                oneDrive: {
                    files: {},
                },
                sortBy: {
                  fieldName: 'name',
                }
            },
            search: {
                enabled: true,
            },
            authentication: {},
            messaging: {
                origin: "https://www.dndbeyond.com",
                channelId: channelId
            },
            typesAndSources: {
                mode: "files",
                filters: selectionType,
                locations: {
                    oneDrive: {},
                },
                pivots: {
                    oneDrive: true,
                    recent: false,
                    shared: false,  
                    sharedLibraries: false,
                    myOrganization: false,
                    site: false,
                },
            },  
            selection: {
              mode: selectionMode
            },
        };

        win = window.open("", "Picker", "width=800,height=600")
        const authToken = await getToken();
        
        const queryString = new URLSearchParams({
            filePicker: JSON.stringify(params),
        });

        const url = `${oneDriveBaseUrl}?${queryString}`;

        const form = win.document.createElement("form");
        form.setAttribute("action", url);
        form.setAttribute("method", "POST");
        win.document.body.append(form);

        const input = win.document.createElement("input");
        input.setAttribute("type", "hidden")
        input.setAttribute("name", "access_token");
        input.setAttribute("value", authToken);
        form.appendChild(input);

        form.submit();

        window.addEventListener("message", (event) => {

            if (event.source && event.source === win) {

                const message = event.data;

                if (message.type === "initialize" && message.channelId === params.messaging.channelId) {

                    port = event.ports[0];

                    port.addEventListener("message", async function(message = event){

                        switch (message.data.type) {

                            case "notification":
                                console.log(`notification: ${message.data}`);
                                break;

                            case "command":

                                port.postMessage({
                                    type: "acknowledge",
                                    id: message.data.id,
                                });

                                const command = message.data.data;

                                switch (command.command) {

                                    case "authenticate":

                                        // getToken is from scripts/auth.js
                                        const token = await getToken();

                                        if (typeof token !== "undefined" && token !== null) {

                                            port.postMessage({
                                                type: "result",
                                                id: message.data.id,
                                                data: {
                                                    result: "token",
                                                    token,
                                                }
                                            });

                                        } else {
                                            console.error(`Could not get auth token for command: ${JSON.stringify(command)}`);
                                        }

                                        break;

                                    case "close":

                                        win.close();
                                        break;

                                    case "pick":
                           
                                        console.log(`Picked: ${JSON.stringify(command)}`);
                                        let embedToken = await getEmbedToken();
                                        let embedLinks=[];
                                        for(let i=0; i<command.items.length; i++){
                                            let embedLink = await getEmbedLink(command.items[i].id, embedToken);
                                            embedLinks.push({
                                                name: command.items[i].name.replace(/\.[0-9a-zA-Z]*$/g, ''),
                                                link: embedLink,
                                                type: command.items[i].name.replace(/.*(\.[0-9a-zA-Z]*)$/g, '$1')
                                            });
                                        }
                                        callback(embedLinks);
                                        port.postMessage({
                                            type: "result",
                                            id: message.data.id,
                                            data: {
                                                result: "success",
                                            },
                                        });

                                        win.close();

                                        break;

                                    default:

                                        console.warn(`Unsupported command: ${JSON.stringify(command)}`, 2);

                                        port.postMessage({
                                            result: "error",
                                            error: {
                                                code: "unsupportedCommand",
                                                message: command.command
                                            },
                                            isExpected: true,
                                        });
                                        break;
                                }

                                break;
                        }



                    });

                    port.start();

                    port.postMessage({
                        type: "activate",
                    });
                }
            }
        });


    }



