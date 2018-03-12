// jquery functions to do Ajax on housepanel.php
// old style setup of tabs to support maximum browsers
var popupStatus = 0;
var popupCell = null;
var popupSave = "";
var popupRoom = "";
var popupVal = 0;
var modalStatus = 0;
var priorOpmode = "Operate";
var returnURL = "housepanel.php";

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

function setCookie(cname, cvalue, exdays) {
    if ( !exdays ) exdays = 30;
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

window.addEventListener("load", function(event) {
//$(document).ready( function() {

    // set the global return URL value
    returnURL = $("input[name='returnURL']").val();
    $(document).data('returnURL',returnURL);
    
    $( "#tabs" ).tabs();
    
    // get default tab from cookie
    var defaultTab = getCookie( 'defaultTab' );
    if ( defaultTab ) {
        try {
            $("#"+defaultTab).click();
        } catch (e) {}
    }
    
//    var cookies = decodeURIComponent(document.cookie);
//    cookies = cookies.split(';');
//    alert(strObject(cookies));
    
    // setupPagemove();
    // setupDraggable();

    // disable return key
    $("form.options").keypress(function(e) {
        if ( e.keyCode===13  && popupStatus===1){
            processPopup();
            return false;
        }
        else if (e.keyCode===13) {
            return false;
        } else if ( e.keyCode===27 && popupStatus===1 ){
            disablePopup();
        }
    });
    
    // set up popup editing - disabled because it is broken
    // setupPopup();
        
    // setup time based updater
    // setupTimers();
    
    // set up option box clicks
    setupFilters();
    
    setupButtons();
    
    setupSaveButton();
    
    setupSliders();
    
    // setup click on a page
    // this appears to be painfully slow so disable
    setupTabclick();
    
    setupColors();
    
    // invoke the new timer that updates everything at once
    allTimerSetup();
    
    allHubitatSetup();
    
});

function rgb2hsv(r, g, b) {
     //remove spaces from input RGB values, convert to int
     var r = parseInt( (''+r).replace(/\s/g,''),10 ); 
     var g = parseInt( (''+g).replace(/\s/g,''),10 ); 
     var b = parseInt( (''+b).replace(/\s/g,''),10 ); 

    if ( r==null || g==null || b==null ||
         isNaN(r) || isNaN(g)|| isNaN(b) ) {
        return {"hue": 0, "saturation": 0, "level": 0};
    }
    
    if (r<0 || g<0 || b<0 || r>255 || g>255 || b>255) {
        return {"hue": 0, "saturation": 0, "level": 0};
    }
    r /= 255, g /= 255, b /= 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
    h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }
    h = Math.floor(h * 100);
    s = Math.floor(s * 100);
    v = Math.floor(v * 100);

    return {"hue": h, "saturation": s, "level": v};
}

function convertToModal(modalcontent) {
    modalcontent = modalcontent + '<div class="modalbuttons"><button name="okay" id="modalokay" class="dialogbtn okay">Okay</button>';
    modalcontent = modalcontent + '<button name="cancel" id="modalcancel" class="dialogbtn cancel">Cancel</button></div>';
    return modalcontent;
}

function createModal(modalcontent, modaltag, addok, responsefunction) {
    var modalid = "modalid";
    
    // skip if a modal is already up...
    if ( modalStatus ) { return; }
    
    if ( !modaltag || !$(modaltag) ) { modaltag = "#controlpanel"; }
    modalcontent = "<div id='" + modalid +"' class='modalbox'>" + modalcontent;
    if ( addok ) {
        modalcontent = convertToModal(modalcontent);
    }
    modalcontent = modalcontent + "</div>";
    $(modaltag).after(modalcontent);
    modalStatus = 1;
    $("#"+modalid).on("click",".dialogbtn",function() {
//        var clk = $(this).attr("name");
//        alert("Clicked " + clk); 
        responsefunction(this);
        $("#"+modalid).remove();
        modalStatus = 0;
    });
}

function setupColors() {
    
   $("div.overlay.color >div.color").each( function() {
        var that = $(this);
        $(this).minicolors({
            position: "bottom left",
            defaultValue: $(this).html(),
            theme: 'default',
            change: function(hex) {
                try {
                    // console.log( "color: " + hex + " = " + $(this).minicolors("rgbaString") );
                    that.html(hex);
                    var aid = that.attr("aid");
                    that.css({"background-color": hex});
                    var huetag = $("#a-"+aid+"-hue");
                    var sattag = $("#a-"+aid+"-saturation");
                    if ( huetag ) { huetag.css({"background-color": hex}); }
                    if ( sattag ) { sattag.css({"background-color": hex}); }
                } catch(e) {}
            },
            hide: function() {
                var newcolor = $(this).minicolors("rgbObject");
                var hsl = rgb2hsv( newcolor.r, newcolor.g, newcolor.b );
                var hslstr = "hsl("+hsl.hue.pad(3)+","+hsl.saturation.pad(3)+","+hsl.level.pad(3)+")";
                var aid = that.attr("aid");
                var tile = '#t-'+aid;
                var bid = $(tile).attr("bid");
                var bidupd = bid;
                var thetype = $(tile).attr("type");
                var ajaxcall = "doaction";
                if ( bid.startsWith("h_") ) {
                    ajaxcall = "dohubitat";
                    bid = bid.substring(2);
                }
//                 alert("posting change to color= hsl= " + hslstr + " bid= " + bid);
                $.post(returnURL, 
                       {useajax: ajaxcall, id: bid, type: thetype, value: hslstr, attr: "color"},
                       function (presult, pstatus) {
                            if (pstatus==="success" ) {
                                updAll("color",aid,bidupd,thetype,presult);
                            }
                       }, "json"
                );
            }
        });
    });   
}

function setupSliders() {
    $("div.overlay.level >div.level").slider({
        orientation: "horizontal",
        min: 0,
        max: 100,
        step: 5,
        stop: function( evt, ui) {
            var thing = $(evt.target);
            thing.attr("value",ui.value);
            
            var aid = thing.attr("aid");
            var tile = '#t-'+aid;
            var bid = $(tile).attr("bid");
            var bidupd = bid;
            var ajaxcall = "doaction";
            if ( bid.startsWith("h_") ) {
                ajaxcall = "dohubitat";
                bid = bid.substring(2);
            }
            var thetype = $(tile).attr("type");
            
            // handle music volume different than lights
            if ( thetype != "music") {
                $.post(returnURL, 
                       {useajax: ajaxcall, id: bid, type: thetype, value: parseInt(ui.value), attr: "level"},
                       function (presult, pstatus) {
                            if (pstatus==="success" ) {
                                // alert( strObject(presult) );
                                updAll("slider",aid,bidupd,thetype,presult);
//                                updateTile(aid, presult);
                            }
                       }, "json"
                );
            } else {
                $.post(returnURL, 
                       {useajax: ajaxcall, id: bid, type: thetype, value: parseInt(ui.value), attr: "level"},
                       function (presult, pstatus) {
                            if (pstatus==="success" ) {
                                // alert( strObject(presult) );
                                updateTile(aid, presult);
                            }
                       }, "json"
                );
                
            }
        }
    });

    // set the initial slider values
    $("div.overlay.level >div.level").each( function(){
        var initval = $(this).attr("value");
        // alert("setting up slider with value = " + initval);
        $(this).slider("value", initval);
    });

    // now set up all colorTemperature sliders
    $("div.overlay.colorTemperature >div.colorTemperature").slider({
        orientation: "horizontal",
        min: 2000,
        max: 6000,
        step: 200,
        stop: function( evt, ui) {
            var thing = $(evt.target);
            thing.attr("value",ui.value);
            
            var aid = thing.attr("aid");
            var tile = '#t-'+aid;
            var bid = $(tile).attr("bid");
            var bidupd = bid;
            var ajaxcall = "doaction";
            if ( bid.startsWith("h_") ) {
                ajaxcall = "dohubitat";
                bid = bid.substring(2);
            }
            var thetype = $(tile).attr("type");
            
            $.post(returnURL, 
                   {useajax: ajaxcall, id: bid, type: thetype, value: parseInt(ui.value), attr: "colorTemperature" },
                   function (presult, pstatus) {
                        if (pstatus==="success" ) {
                            // alert( strObject(presult) );
                            updAll("slider",aid,bidupd,thetype,presult);
//                                updateTile(aid, presult);
                        }
                   }, "json"
            );
        }
    });

    // set the initial slider values
    $("div.overlay.colorTemperature >div.colorTemperature").each( function(){
        var initval = $(this).attr("value");
        // alert("setting up slider with value = " + initval);
        $(this).slider("value", initval);
    });
    
}

function cancelDraggable() {
    $("div.thing").each(function(){
        if ( $(this).draggable("instance") ) {
            $(this).draggable("destroy");
        }
    });
}

function cancelSortable() {
    $("div.panel").each(function(){
        if ( $(this).sortable("instance") ) {
            $(this).sortable("destroy");
        }
    });
}

function cancelPagemove() {
    $("ul.ui-tabs-nav").each(function(){
        if ( $(this).sortable("instance") ) {
            $(this).sortable("destroy");
        }
    });
}

function setupPagemove() {
    
    // make the room tabs sortable
    // the change function does a post to make it permanent
    $("ul.ui-tabs-nav").sortable({
        axis: "x", 
        items: "> li",
        cancel: "li.nodrag",
        opacity: 0.5,
        containment: "ul.ui-tabs-nav",
        delay: 200,
        revert: true,
        update: function(event, ui) {
            var pages = {};
            var k = 0;
            // get the new list of pages in order
            $("ul.ui-tabs-nav li.drag").each(function() {
                var pagename = $(this).text();
                pages[pagename] = k;
                k++;
            });
            $.post(returnURL, 
                {useajax: "pageorder", id: "none", type: "rooms", value: pages, attr: "none"},
                    function (presult, pstatus) {
                        // alert("Updated page order with status= "+pstatus+" result= "+
                        //       strObject(presult));
                        // set the room numbers using the options
                        if (pstatus==="success") {
                            var newrooms = presult["order"];
                            // alert(strObject(newrooms));
                            $('table.headoptions th > input[type="hidden"]').each(function() {
                               var rname = $(this).attr("name").substring(2);
                               var newval = parseInt(newrooms[rname]);
                               // alert("room = "+rname+" oldval= "+rvalue+" newval= "+newval);
                               $(this).attr("value",newval);
                            });
                        }
                    }, "json"
            );
        }
    });
}

function setupSortable() {

    $("div.panel").sortable({
        containment: "parent",
        scroll: false,
        items: "> div",
        delay: 50,
//        grid: [10, 10],
        stop: function(event, ui) {
            var tile = $(ui.item).attr("tile");
            var roomtitle = $(ui.item).attr("panel");
            var things = [];
            $("div.thing[panel="+roomtitle+"]").each(function(){
                things.push($(this).attr("tile"));
            });
            
//            alert("Sorted thing: "+tile+" room: "+roomtitle+" things: "+strObject(things));
            $.post(returnURL, 
                   {useajax: "pageorder", id: "none", type: "things", value: things, attr: roomtitle}
            );
        }
    });
        
    
}

function setupDraggable() {
    
    $("div.thing").draggable({
        revert: false,
        containment: "parent",
        delay: 50,
        grid: [10, 10],
        stop: function(event, ui) {
            var dragthing = {};
            dragthing["id"] = $(event.target).attr("id");
            var bid = $(event.target).attr("bid");
            var thingtype = $(event.target).attr("type");
            dragthing["tile"] = $(event.target).attr("tile");
            dragthing["panel"] = $(event.target).attr("panel");
           
//            alert("xpos= "+ui.position.left+" ypos= "+ui.position.top+" id= "+bid+" type= "+thingtype+" drag= "+strObject(dragthing));
//            $.post(returnURL, 
//                   {useajax: "pageorder", id: "none", type: "things", value: things, attr: roomtitle}
//            );
            // now post back to housepanel to save the position
            // also send the dragthing object to get panel name and tile pid index
            $.post(returnURL, 
                   {useajax: "dragdrop", id: bid, type: thingtype, value: dragthing, attr: ui.position}
            );
        }
    });
    
}

function dynoForm(ajaxcall, idval, typeval) {
    idval = idval ? idval : 0;
    typeval = typeval ? typeval : "none";
    var controlForm = $('<form>', {'name': 'controlpanel', 'action': returnURL, 'target': '_top', 'method': 'POST'});
    controlForm.appendTo("body");
    // alert("Posting form for ajaxcall= " + ajaxcall + " to: " + retval);
    // lets now add the hidden fields we need to post our form
    controlForm.append(
                  $('<input>', {'name': 'useajax', 'value': ajaxcall, 'type': 'hidden'})
        ).append(
                  $('<input>', {'name': 'id', 'value': idval, 'type': 'hidden'})
        ).append(
                  $('<input>', {'name': 'type', 'value': typeval, 'type': 'hidden'})
        );
    return controlForm;
}

function setupButtons() {

//    $("#optionsbutton").on("click", null, function(evt) {
    $("#controlpanel").on("click", "div.formbutton", function() {
        var buttonid = $(this).attr("id");
        createModal("Perform " + buttonid + " operation... Are you sure?","#controlpanel", true, function(ui) {
            var clk = $(ui).attr("name");
            if ( clk=="okay" ) {
                var newForm = dynoForm(buttonid);
                newForm.submit();
            }
        });
    });

    $("div.modeoptions").on("click","input.radioopts",function(evt){
        var opmode = $(this).attr("value");
        if ( opmode !== priorOpmode ) {
            if ( opmode=="Reorder" ) {
                cancelDraggable();
                cancelPagemove();
                setupSortable();
                setupPagemove();
            } else if ( opmode=="DragDrop" ) {
                cancelSortable();
                cancelPagemove();
                setupDraggable();
                setupPagemove();
            } else if ( opmode=="Operate" ) {
                cancelDraggable();
                cancelSortable();
                cancelPagemove();
            }
            priorOpmode = opmode;
            $("#opmode").html("Mode set to: " + opmode );
            $("#opmode").show();
            $("#opmode").hide("fade",null,3000);
        }
    });

    $("#controlpanel").on("click","div.restoretabs",function(evt){
        toggleTabs();
//        createModal("Toggle Tabs. Are you sure?","#controlpanel", true, function(ui) {
//            var clk = $(ui).attr("name");
//            if ( clk=="okay" ) {
//                toggleTabs();
//            }
//        });
    });
}

function setupSaveButton() {
    
    $("#submitoptions").click(function(evt) {
        var sheet = document.getElementById('customtiles').sheet;
        var sheetContents = "";
        c=sheet.cssRules;
        for(j=0;j<c.length;j++){
            sheetContents += c[j].cssText;
        };
        var regex = /[{;}]/g;
        var subst = "$&\n";
        sheetContents = sheetContents.replace(regex, subst);
        
        // create form data from our table plus the custom edits
        var alldata = new FormData(document.getElementById("optionspage"));
        alldata.append("cssdata", sheetContents);
        alldata.append("useajax", "saveoptions");
        
        var request = new XMLHttpRequest();
        request.open('POST', 'housepanel.php', false);
//        $response = $.post(returnURL, 
//                    {useajax: "saveoptions", id: "", type: "", value: alldata, attr: ""}
//        );
        
        request.send(alldata);
        console.log(request.response);
        
        if (request.response == "success") {
            $("form.options").submit(); 
        }
    });
}

function setupFilters() {
   // set up option box clicks
    $('input[name="useroptions[]"]').click(function() {
        var theval = $(this).val();
        var ischecked = $(this).prop("checked");
        // var that = this;
        // alert("clicked on val = "+theval+ " ischecked = " + ischecked + " ... about to change screen...");
        
        // set the class of all rows to invisible or visible
        var rowcnt = 0;
        var odd = "";
        $('tr[type="'+theval+'"]').each(function() {
//            var theclass = $(this).attr("class");
            if ( ischecked ) {
                $(this).attr("class", "showrow");
            } else {
                $(this).attr("class", "hiderow");
           }
        });
        $('table.roomoptions tr').each(function() {
            var theclass = $(this).attr("class");
            if ( theclass != "hiderow" ) {
                rowcnt++;
                rowcnt % 2 == 0 ? odd = " odd" : odd = "";
                $(this).attr("class", "showrow"+odd);
           }
        });
    });
}

function setupPopup() {
        //Click out event!
    $("table.roomoptions").click(function(){
        processPopup();
    });
    
    // add code to disable when click anywhere but the cell
    $("div.maintable").click(function(e) {
        if ( e.target.id !== "trueincell" && popupStatus==1) {
            disablePopup();
        }
            // alert ( e.target.id );
    });
    
    
    // Press Escape or Return event!
    // fix long-standing bug
    $(document).keypress(function(e){
        if ( e.keyCode===13  && popupStatus===1){
            processPopup();
        } else if ( e.keyCode===27 && popupStatus===1 ){
            disablePopup();
        }
    });

    // disable input in our dynamic form item
    $("#trueincell").keypress(function(e) {
        if ( e.keyCode===27 && popupStatus==1 ){
            disablePopup();
        }
    });
    
    $("#trueincell").focus().blur(function() {
        processPopup();
    });
    
//    $("table.headoptions th.roomname").each(function() {
//        // bind click events to incell editing
//        $(this).css({
//            "cursor": "pointer"
//        });
//        $(this).on("click", "th.roomname", jeditTableCell);
//    });
    $("table.headoptions").on("click", "th.roomname", function() {
        if ($(this).html().startsWith("<input id")) { return true; }

        // if another popup is active, process it
        if (popupStatus === 1) {
            processPopup();
        }

        var roomval = $(this).children().first().attr("value");
        var roomname = $(this).text().trim();

        //do a real in-cell edit - save global parameters
        // cellclicked = that;
        popupStatus = 1;
        popupSave = $(this).html();
        popupCell = this;
        popupVal = parseInt(roomval);
        popupRoom = roomname;

        // change the content to an input box
        var thesize = roomname.length + 2;

        // save anything after the pure text
        // var savedhidden = $(that).html().substring(thesize);

//         if (thesize < maxlen+1) thesize = maxlen+1;
        var oldhidden = ""; // '<input type="hidden" name="o_' + roomname + '" value="' + popupVal + '" />';
        $(this).html('<input id="trueincell" type="text" size="'+ thesize + '" value="' + roomname+'" />' + oldhidden);
        return false;
        
    });

// Hiding Confirmation of Customization Span Until Needed
//$('#showCssSaved').hide();  
//    $("table.headoptions th.thingname").click(function() {
//        alert("clicked on Room names row");
//    });
       
}

function toggleTabs() {
    var hidestatus = $("#restoretabs");
    if ( $("#roomtabs").hasClass("hidden") ) {
        $("#roomtabs").removeClass("hidden");
        if ( hidestatus ) hidestatus.html("Hide Tabs");
    } else {
        $("#roomtabs").addClass("hidden");
        if ( hidestatus ) hidestatus.html("Show Tabs");
    }
}

function processPopup( ) {
    // processEdit( ineditvalue );
    // $(cellclicked).empty().html( ineditvalue );
    // alert("ineditvalue = " + ineditvalue);
//    alert("processing... popupStatus = " + popupStatus);

    if (popupStatus==1) {
        // put the new text on the screen
        var thenewval = $("#trueincell").val();
//        alert("Changing room name from: " + popupRoom + " to: "+thenewval);
        
        // clean the user provided room name to ensure it doesnt have crap in it
        //TODO
        
        var newhidden = '<input type="hidden" name="o_' + thenewval + '" value="' + popupVal + '" />';
        $(popupCell).html( thenewval + newhidden );
//        
        // replace the room name in the entire options table column
        $('table.roomoptions td > input[name="'+popupRoom+'\[\]"]').each(function() {
            // var tileval = parseInt($(this).attr("value"));
            $(this).attr("name",thenewval + '[]');
        });
        //       
    }

    popupStatus = 0;
}

function disablePopup(){
//    alert("disabling... popupStatus = " + popupStatus + " popupSave = " + popupSave);
    
    //disables popup only if it is enabled
    if( popupStatus==1 && popupSave){
        $(popupCell).html(popupSave);
    }
    popupStatus = 0;
}

function strObject(o) {
  var out = '';
  for (var p in o) {
    out += p + ': ';
    if (typeof o[p] === "object") {
        out += strObject(o[p]);
    } else {
        out += o[p] + '\n';
    }
  }
  return out;
}

function lenObject(o) {
  var cnt= 0;
  for (var p in o) {
      cnt++;
  }
  return cnt;
}

function fixTrack(tval) {
    if ( tval.trim() === "" ) {
        tval = "None"; 
    } 
    else if ( tval.length > 124) { 
        tval = tval.substring(0,120) + " ..."; 
    }
    return tval;
}


// update all the subitems of any given specific tile
// note that some sub-items can update the values of other subitems
// this is exactly what happens in music tiles when you hit next and prev song
function updateTile(aid, presult) {

    // do something for each tile item returned by ajax call
    $.each( presult, function( key, value ) {
        var targetid = '#a-'+aid+'-'+key;

        // only take action if this key is found in this tile
        if ($(targetid) && value) {
            var oldvalue = $(targetid).html();
            var oldclass = $(targetid).attr("class");
            // alert(" aid="+aid+" key="+key+" targetid="+targetid+" value="+value+" oldvalue="+oldvalue+" oldclass= "+oldclass);

            // remove the old class type and replace it if they are both
            // single word text fields like open/closed/on/off
            // this avoids putting names of songs into classes
            // also only do this if the old class was there in the first place
            // also handle special case of battery and music elements
            if ( key=="battery") {
                var powmod = parseInt(value);
                powmod = powmod - (powmod % 10);
                value = "<div style=\"width: " + powmod.toString() + "%\" class=\"ovbLevel L" + powmod.toString() + "\"></div>";
            } else if ( key=="track") {
                value = fixTrack(value);
            }
            // handle weather icons
            else if ( key==="weatherIcon" || key==="forecastIcon") {
                if ( value.substring(0,3) === "nt_") {
                    value = value.substring(3);
                }
                if ( oldvalue != value ) {
                    $(targetid).removeClass(oldvalue);
                    $(targetid).addClass(value);
                }
//                value = "<img src=\"media/" + iconstr + ".png\" alt=\"" + iconstr + "\" width=\"60\" height=\"60\">";
//                value += "<br />" + iconstr;
            } else if ( (key == "level" || key == "colorTemperature") && $(targetid).slider ) {
//                var initval = $(this).attr("value");
                $(targetid).slider("value", value);
                value = false;
            } else if ( key=="color") {
//                alert("updating color: "+value);
                $(targetid).html(value);
//                setupColors();
            } else if ( oldclass && oldvalue && value &&
                     $.isNumeric(value)===false && 
                     $.isNumeric(oldvalue)===false &&
                     oldclass.indexOf(oldvalue)>=0 ) {
                    $(targetid).removeClass(oldvalue);
                    $(targetid).addClass(value);
                
            }

                // update the content 
                if (oldvalue && value) {
                    $(targetid).html(value);
                }
            }
    });
}

// this differs from updateTile by calling ST to get the latest data first
// it then calls the updateTile function to update each subitem in the tile
function refreshTile(aid, bid, thetype) {
    var ajaxcall = "doquery";
    if ( bid.startsWith("h_") ) {
        ajaxcall = "queryhubitat";
        bid = bid.substring(2);
    }
    $.post(returnURL, 
        {useajax: ajaxcall, id: bid, type: thetype, value: "none", attr: "none"},
        function (presult, pstatus) {
            if (pstatus==="success" && presult!==undefined ) {
//                alert( strObject(presult) );
                updateTile(aid, presult);
            }
        }, "json"
    );
}

// refresh tiles on this page when switching to it
function setupTabclick() {
    // $("li.ui-tab > a").click(function() {
    $("a.ui-tabs-anchor").click(function() {
        // save this tab for default next time
        var defaultTab = $(this).attr("id");
        if ( defaultTab ) {
            setCookie( 'defaultTab', defaultTab, 30 );
        }
        
        // disable the refresh feature because it is too slow and not really needed
//        var panel = $(this).text();
//        if ( panel ) {
//            alert("Updating panel = "+panel);
//            $("div.panel-"+panel+" div.thing").each(function() {
//                var aid = $(this).attr("id").substring(2);
//                var bid = $(this).attr("bid");
//                var thetype = $(this).attr("type");
//                refreshTile(aid, bid, thetype);
//
//            });
//        }
    });
}

function setupTimers() {
    
    // set up a timer for each tile to update automatically
    // but only for tabs that are being shown
    $('div.thing').each(function() {
        
            var bid = $(this).attr("bid");
            var aid = $(this).attr("id").substring(2);
            var thetype = $(this).attr("type");
            var panel = $(this).attr("panel");

            // fix bug where panel was not proper case
            // eventually we'll have to use actual item - now is eventually!!
            // panel = panel.toLowerCase();
            var timerval = 0;

            switch (thetype) {
                case "switch":
                case "bulb":
                case "light":
                case "switchlevel":
                case "presence":
                    timerval = 30000;
                    if ( bid.startsWith("h_") ) { timerval = 5000; }
                    break;

                case "motion":
                case "contact":
                    timerval = 30001;
                    if ( bid.startsWith("h_") ) { timerval = 5000; }
                    break;

                case "thermostat":
                case "temperature":
                    timerval = 60002;
                    break;

                case "music":
                    timerval = 60003;
                    break;

                case "weather":
                    timerval = 90004;
                    break;

                case "mode":
                case "routine":
                    timerval = 90005;
                    break;

                case "lock":
                case "door":
                case "valve":
                    timerval = 60006;
                    if ( bid.startsWith("h_") ) { timerval = 5002; }
                    break;

                case "image":
                    timerval = 60007;
                    break;

                // update clock every minute
                case "clock":
                    timerval = 60000;
                    break;
            }

            if ( timerval && aid && bid ) {

                // define the timer callback function to update this tile
                var apparray = [aid, bid, thetype, panel, timerval];
                apparray.myMethod = function() {

                    // only call and update things if this panel is visible
                    // or if it is a clock tile
                    if ( this[2]=="clock" || $('#'+this[3]+'-tab').attr("aria-hidden") === "false" ) {
                        var that = this;
    //                    alert("aid= "+that[0]+" bid= "+that[1]+" type= "+that[2]);
                        refreshTile(that[0], that[1], that[2]);
                    }
                    setTimeout(function() {apparray.myMethod();}, this[4]);
                };

                // wait before doing first one
                setTimeout(function() {apparray.myMethod();}, timerval);
//            }
        
        }
    });
}

function allTimerSetup() {

    // define the timer callback function to update all tiles every 60 seconds
    var timerval = 15000;
    var updarray = ["all",timerval];
    updarray.myMethod = function() {
        var that = this;
        // alert("About to post update...");
        $.post(returnURL, 
            {useajax: "doquery", id: that[0], type: that[0], value: "none", attr: "none"},
            function (presult, pstatus) {
//                alert("pstatus = " + pstatus+ " presut= "+ strObject(presult));
                if (pstatus=="success" && presult!==undefined ) {
//                    console.log("Polling [" + returnURL + "] update: ST returned "+ Object.keys(presult).length+ " items");
                    
                    // go through all tiles and update
                    $('div.thing').each(function() {
                        var tileid = $(this).attr("tile");
                        var bid = $(this).attr("bid");
                        var aid = $(this).attr("id").substring(2);
                        if ( !bid.startsWith("h_") && tileid in presult ) {
                            var thevalue = presult[tileid];
                            // handle both direct values and bundled values
                            if ( thevalue.hasOwnProperty("value") ) {
                                thevalue = thevalue.value;
                            }
                            // if ( tileid=="74" ) { alert("updating tile " + tileid + " ... value = "+ strObject(thevalue)); }
                            if ( thevalue ) { updateTile(aid,thevalue); }
                        }
                        
                    });
                }
            }, "json"
        );

        // repeat the method above indefinitely
        setTimeout(function() {updarray.myMethod();}, this[1]);
    };

    // wait before doing first one
    setTimeout(function() {updarray.myMethod();}, timerval);
}

function allHubitatSetup() {

    // define the timer callback function to update all tiles every 60 seconds
    var timerval = 5000;
    var hubarray = ["all",timerval];
    hubarray.myMethod = function() {
        var that = this;
        // alert("About to post update...");
        $.post(returnURL, 
            {useajax: "queryhubitat", id: that[0], type: that[0], value: "none", attr: "none"},
            function (presult, pstatus) {
//                alert("pstatus = " + pstatus+ " presut= "+ strObject(presult));
                if (pstatus=="success" && presult!==undefined ) {
                    // console.log("Polling [" + returnURL + "] update: Hubitat returned "+ Object.keys(presult).length+ " items");
                    
                    // go through all tiles and update
                    $('div.thing').each(function() {
                        var tileid = $(this).attr("tile");
                        var bid = $(this).attr("bid");
                        var aid = $(this).attr("id").substring(2);
                        if ( bid.startsWith("h_") && tileid in presult ) {
                            var thevalue = presult[tileid];
                            // handle both direct values and bundled values
                            if ( thevalue.hasOwnProperty("value") ) {
                                thevalue = thevalue.value;
                            }
                            // if ( tileid=="74" ) { alert("updating tile " + tileid + " ... value = "+ strObject(thevalue)); }
                            if ( thevalue ) { updateTile(aid,thevalue); }
                        }
                        
                    });
                }
            }, "json"
        );

        // repeat the method above indefinitely
        setTimeout(function() {hubarray.myMethod();}, this[1]);
    };

    // wait before doing first one
    setTimeout(function() {hubarray.myMethod();}, timerval);
}

function updateMode() {
    $('div.thing.mode-thing').each(function() {
        var otheraid = $(this).attr("id").substring(2);
        var rbid = $(this).attr("bid");
        setTimeout(function() {
            refreshTile(otheraid, rbid, "mode");
        }, 2000);
    });
}

// find all the things with "bid" and update the value clicked on somewhere
// this routine is called every time we click on something to update its value
// but we also update similar things that are impacted by this click
// that way we don't need to wait for the timers to kick in to update
// the visual items that people will expect to see right away
function updAll(trigger, aid, bid, thetype, pvalue) {

    // update trigger tile first
    // alert("aid= "+aid+" bid= "+bid+" type= "+thetype+" pvalue= "+strObject(pvalue));
    if ( trigger !== "slider") {
        updateTile(aid, pvalue);
    }
    
    // for music tiles, wait few seconds and refresh again to get new info
    if (thetype==="music") {
        // alert( strObject(pvalue));
        setTimeout(function() {
            refreshTile(aid, bid, thetype);
        }, 3000);
    }
    
    // for doors wait before refresh to give garage time to open or close
    if (thetype==="door") {
        // alert( strObject(pvalue));
        setTimeout(function() {
            refreshTile(aid, bid, thetype);
        }, 15000);
    }
        
    // go through all the tiles this bid and type (easy ones)
    // this will include the trigger tile so we skip it
    $('div.thing[bid="'+bid+'"][type="'+thetype+'"]').each(function() {
        var otheraid = $(this).attr("id").substring(2);
        if (otheraid !== aid) { updateTile(otheraid, pvalue); }
    });
    
    // if this is a switch on/off trigger go through and set all light types
    // change to use refreshTile function so it triggers PHP session update
    // but we have to do this after waiting a few seconds for ST to catch up
    // actually we do both for instant on screen viewing
    // the second call is needed to make screen refreshes work properly
//    if (thetype==="switch" || thetype==="bulb" || thetype==="light") {
    if (trigger=="switch.on" || trigger=="switch.off") {
        // updateMode();
        $('div.thing[bid="'+bid+'"][type="switch"]').each(function() {
            var otheraid = $(this).attr("id").substring(2);
            if (otheraid !== aid) { updateTile(otheraid, pvalue); }
        });
        $('div.thing[bid="'+bid+'"][type="switchlevel"]').each(function() {
            var otheraid = $(this).attr("id").substring(2);
            if (otheraid !== aid) { updateTile(otheraid, pvalue); }
        });
        $('div.thing[bid="'+bid+'"][type="bulb"]').each(function() {
            var otheraid = $(this).attr("id").substring(2);
            if (otheraid !== aid) {
                updateTile(otheraid, pvalue);
//                var rbid = $(this).attr("bid");
//                setTimeout(function() {
//                    refreshTile(otheraid, rbid, "bulb");
//                }, 10000);
            }
        });
        $('div.thing[bid="'+bid+'"][type="light"]').each(function() {
            var otheraid = $(this).attr("id").substring(2);
            if (otheraid !== aid) {
                updateTile(otheraid, pvalue);
//                var rbid = $(this).attr("bid");
//                setTimeout(function() {
//                    refreshTile(otheraid, rbid, "light");
//                }, 10000);
            }
        });
    }
    
    // if this is a routine action then update the modes immediately
    // also do this update for piston or momentary refreshes
    // use the same delay technique used for music tiles noted above
    if (thetype==="routine") {
        updateMode();
    }
    
    // if this is a switchlevel go through and set all switches
    // change to use refreshTile function so it triggers PHP session update
    // but we have to do this after waiting a few seconds for ST to catch up
    // NOTE: removed the above logic because our updates are now faster and frequent
    // if (thetype==="switchlevel" || thetype==="bulb" || thetype==="light") {
    if (trigger==="level-up" || trigger==="level-dn" || trigger==="slider" ||
        trigger==="hue-up" || trigger==="hue-dn" ||
        trigger==="saturation-up" || trigger==="saturation-dn" ||
        trigger==="colorTemperature-up" || trigger==="colorTemperature-dn" ) {
//        alert("level trigger: bid= "+bid+" pvalue= "+strObject(pvalue));
        $('div.thing[bid="'+bid+'"][type="switch"]').each(function() {
            var otheraid = $(this).attr("id").substring(2);
            updateTile(otheraid, pvalue);
        });
        $('div.thing[bid="'+bid+'"][type="switchlevel"]').each(function() {
            var otheraid = $(this).attr("id").substring(2);
            updateTile(otheraid, pvalue);
//            var rbid = $(this).attr("bid");
//            setTimeout(function() {
//                refreshTile(otheraid, rbid, "switchlevel");
//            }, 10000);
        });
        $('div.thing[bid="'+bid+'"][type="bulb"]').each(function() {
            var otheraid = $(this).attr("id").substring(2);
            updateTile(otheraid, pvalue);
//            var rbid = $(this).attr("bid");
//            setTimeout(function() {
//                refreshTile(otheraid, rbid, "bulb");
//            }, 10000);
        });
        $('div.thing[bid="'+bid+'"][type="light"]').each(function() {
            var otheraid = $(this).attr("id").substring(2);
            updateTile(otheraid, pvalue);
//            var rbid = $(this).attr("bid");
//            setTimeout(function() {
//                refreshTile(otheraid, rbid, "light");
//            }, 10000);
        });
    }
    
}

// setup trigger for clicking on the action portion of this thing
// this used to be done by page but now it is done by sensor type
function setupPage(trigger) {
   
    // alert("setting up " + trigger);
    var actionid = "div." + trigger;

    $(actionid).click(function() {
        
        var aid = $(this).attr("aid");
        
        // avoid doing click if the target was the title bar
        // or if not in Operate mode
        if ( priorOpmode!=="Operate" || modalStatus ||
             ( $(this).attr("id") && $(this).attr("id").startsWith("s-") ) ) return;

        var theclass = $(this).attr("class");
        var subid = $(this).attr("subid");
        var tile = '#t-'+aid;
        var bid = $(tile).attr("bid");
        var bidupd = bid;
        var thetype = $(tile).attr("type");
        
        // set the action differently for Hubitat
        var ajaxcall = "doaction";
        if ( bid.startsWith("h_") ) {
            ajaxcall = "dohubitat";
            // bid = bid.substring(2);
        }

        // get target id and contents
        var targetid = '#a-'+aid+'-'+subid;
        var thevalue;
        
        // for switches and locks set the command to toggle
        // for most things the behavior will be driven by the class value = swattr
        if (thetype==="switch" || thetype==="lock" || thetype==="door" ||
            thetype==="switchlevel" ||thetype==="bulb" || thetype==="light") {
            thevalue = "toggle";
        // handle shm special case
        } else if ( thetype=="shm") {
            thevalue = $(targetid).html();
            if ( thevalue=="off" ) { thevalue = "stay"; }
            else if ( thevalue=="stay") { thevalue = "away"; }
            else { thevalue = "off"; }
        } else {
            thevalue = $(targetid).html();
        }

        // alert('aid= ' + aid +' bid= ' + bid + ' targetid= '+targetid+ ' subid= ' + subid + ' type= ' + thetype + ' class= ['+theclass+'] value= '+thevalue);

        // turn momentary items on or off temporarily
        if (thetype==="momentary" || thetype==="piston") {
            var tarclass = $(targetid).attr("class");
            var that = targetid;
            // define a class with method to reset momentary button
            var classarray = [$(that), tarclass, thevalue];
            classarray.myMethod = function() {
                this[0].attr("class", this[1]);
                this[0].html(this[2]);
            };
            $.post(returnURL, 
                {useajax: ajaxcall, id: bid, type: thetype, value: thevalue, attr: theclass},
                function(presult, pstatus) {
                    // alert("pstatus= "+pstatus+" len= "+lenObject(presult)+" presult= "+strObject(presult));
                    if (pstatus==="success" && presult!==undefined && presult!==false) {
                        if (thetype==="piston") {
                            $(that).addClass("firing");
                            $(that).html("firing");
                        }
                        else if ( $(that).hasClass("on") ) {
                            $(that).removeClass("on");
                            $(that).addClass("off");
                            $(that).html("off");
                        } else {
                            $(that).removeClass("off");
                            $(that).addClass("on");
                            $(that).html("on");
                        }
                        setTimeout(function(){classarray.myMethod();}, 1500);
                        updateMode();
                    }
                });
//        } else if (thetype==="switch" || thetype==="lock" || thetype==="switchlevel" ||
//                   thetype==="thermostat" || thetype==="music" || thetype==="bulb" ) {
        // now we invoke action for everything
        // within the groovy code if action isn't relevant then nothing happens
        } else {
//            alert("id= "+bid+" type= "+thetype+" value= "+thevalue+" class="+theclass);
            console.log("id= "+bid+" type= "+thetype+" value= "+thevalue+" class="+theclass);
            $.post(returnURL, 
                   {useajax: ajaxcall, id: bid, type: thetype, value: thevalue, attr: theclass},
                   function (presult, pstatus) {
                        if (pstatus==="success" ) {
//                            alert( strObject(presult) );
                            console.log( "POST returned: "+ strObject(presult) );
                            updAll(trigger,aid,bidupd,thetype,presult);
                        }
                   }, "json"
            );
            
        } 
                            
    });
   
};
