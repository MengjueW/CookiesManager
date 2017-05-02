var domain_dic = {};
var name_dic = {};

function select(selector) {
	return document.querySelector(selector);
}

function removeCookie(cookie) {
	var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
	chrome.cookies.remove({
		"url" : url,
		"name" : cookie.name
	});
}

function removeCookiesForDomain(domain) {
  if (domain_dic[domain]) {
    for (i = 0; i < domain_dic[domain].length ; i++) {
      removeCookie(domain_dic[domain][i]);
    }
  }
}

function removeCookiesForName(name) {
  if (name_dic[name]) {
    for (i = 0; i < name_dic[name].length ; i++) {
      removeCookie(name_dic[name][i]);
    }
  }
}

function removeCookieForDomainAndForName(domain, name) {
  if (domain_dic[domain]) {
    for (i = 0; i < domain_dic[domain].length ; i++) {
      if (domain_dic[domain][i].name === name) {
        removeCookie(domain_dic[domain][i]);
      }
    }
  }
}

function startListening() {
	chrome.cookies.onChanged.addListener(reloadPage);
}

function getJsonNoMatterWhat(url, callback) {
	//hack from chrollusion
	jQuery.ajax({
		url : url,
		dataType : "json",
		error : function(xhr, errText, err) {
			var trackers = JSON.parse(xhr.responseText);
			callback(trackers);
		},
		success : function(data, okText, xhr) {
			callback(data);
		}
	});
}

function onload() {
  startListening();
	chrome.cookies.getAll({}, function(cookies) {
    select("#total_count").innerText = cookies.length;

    var dataSet = [];
    for(i = 0; i < cookies.length ; i++) {
      var cookie = cookies[i];
      var domain = cookie.domain;
      var name = cookie.name;
      var temp = [];
      temp.push(cookie.domain);
      temp.push(cookie.name);
      temp.push(cookie.secure);
      temp.push(cookie.hostOnly)
      dataSet.push(temp);

      if (!domain_dic[domain]) {
  			domain_dic[domain] = [];
  		}
  		domain_dic[domain].push(cookie);

      if (!name_dic[name]) {
        name_dic[name] = [];
      }
      name_dic[name].push(cookie);
    }
    select("#domain_count").innerText = Object.keys(domain_dic).length;
    select("#name_count").innerText = Object.keys(name_dic).length;
    $('#your_cookies_list').DataTable( {
        data: dataSet,
        columns: [
            { title: "Domain" },
            { title: "Name" },
            { title: "Secure" },
            { title: "Host Only" }
        ]
    } );
	});
}

function reloadPage() {
  location.reload();
}

function test() {
  removeCookieForDomainAndForName('.a.scorecardresearch.com', 'CP16');
}

function pressDomainButton() {
  var domain = select("#domain_input").value;
  if (domain == "") {
    return;
  }
  removeCookiesForDomain(domain);
}

function pressNameButton() {
  var name = select("#name_input").value;
  console.log(name);
  if (name == "") {
    return;
  }
  removeCookiesForName(name);
}

function pressDomainNameButton() {
  var domain = select("#domain_name_input1").value;
  var name = select("#domain_name_input2").value;
  console.log(domain, name);
  if (domain == "" && name == "") {
    return;
  } else if (domain == "") {
    return pressDomainButton();
  } else if (name == "") {
    return pressNameButton();
  } else {
    removeCookieForDomainAndForName(domain, name);
  }
}

document.addEventListener('DOMContentLoaded', function() {
	onload();
  document.querySelector('#clean').addEventListener('click', test);
  document.querySelector('#domain_button').addEventListener('click', pressDomainButton);
  document.querySelector('#name_button').addEventListener('click', pressNameButton);
  document.querySelector('#domain_name_button').addEventListener('click', pressDomainNameButton);
});
