coverage_url = "https://gds.eligibleapi.com/v1.1/coverage/all.json"

showForm = function () {
  $(".test-param").hide();
  $(".real-param").show();
}

showTest = function () {
  $(".real-param").hide();
  $(".test-param").show();
}

errorCallback = function (xhr, textStatus, errorThrown) {
  window.alert("Error on request: " + errorThrown);
}

successCallback = function (data) {
  $(".has-error").removeClass("has-error");

  $(".eligible-plugin-coverage-template").remove();
  if (data.error) {
    buildError(data.error);
  } else {
    buildCoverageHTML(data);
  }

  //$("#benefits_accordion").accordion();
}

objectToUrlParameters = function (obj) {
  var str = "";
  for (var key in obj) {
    if (str != "") {
      str += "&";
    }
    str += key + "=" + encodeURIComponent(obj[key]);
  }
  return str;
};

coverageRequest = function (params) {
  var options;
  var parameters = objectToUrlParameters(params)
  options = {
    data: parameters,
    headers: {
      "User-Agent": "JS Demo",
      Accept: "application/json"
    },
    type: "GET",
    dataType: "json",
    processData: false,
    success: function (data, textStatus, jqXHR) {
      console.log("GET Ajax Call SUCCESS URL:" + coverage_url + "?" + parameters + ", Status :" + textStatus)
      successCallback(data);
    },
    error: function (xhr, textStatus, errorThrown) {
      console.log("GET Ajax Call FAILURE URL:" + coverage_url + "?" + parameters + ", Status :", textStatus, ", Error: ", errorThrown)
      errorCallback(xhr, textStatus, errorThrown);
    }
  };

  $.ajax(coverage_url, options);
}


$(document).ready(function () {
  if ($("input[name=test]:checked").val() == "true") {
    showTest();
  } else {
    showForm();
  }

  $("input[name=test]").on('click', function () {
    if ($(this).val() == 'true') {
      showTest();
    } else {
      showForm();
    }
  });

  $(".form-coverage").on('submit', function (e) {
    e.preventDefault();

    var test = $("input[name=test]:checked").val();

    if (test == "true") {
      fetchTestCoverage();
    } else {
      fetchRealCoverage();
    }
  });
});

fetchRealCoverage = function () {
  var params = {
    api_key: $("#api_key").val(),
    payer_id: $("#payer_id").val(),
    provider_npi: $("#provider_npi").val(),
    provider_last_name: $("#provider_last_name").val(),
    provider_first_name: $("#provider_first_name").val(),
    member_id: $("#member_id").val(),
    member_first_name: $("#member_first_name").val(),
    member_last_name: $("#member_last_name").val(),
    member_dob: $("#member_dob").val()
  };

  $.each(params, function (key) {
    if ((params[key] === undefined) || (params[key].match(/^\s*$/))) {
      $("#" + key).closest('.form-group').addClass('has-error');
    } else {
      $("#" + key).closest('.form-group').removeClass('has-error');
    }
  });

  if ($(".has-error").length > 0) {
    alert("Please fill all the fields");
  } else {
    coverageRequest(params);
  }
}

fetchTestCoverage = function () {
  var params = {
    api_key: $("#api_key").val(),
    test_member_id: $("#test_member_id").val()
  };

  $.each(params, function (key) {
    if ((params[key] === undefined) || (params[key].match(/^\s*$/))) {
      $("#" + key).closest('.form-group').addClass('has-error');
    } else {
      $("#" + key).closest('.form-group').removeClass('has-error');
    }
  });

  if ($(".has-error").length > 0) {
    alert("Please fill all the fields");
  } else {
    params['test'] = 'true';
    params['member_id'] = params['test_member_id'];
    delete params['test_member_id'];
    params['provider_npi'] = params['provider_last_name'] = params['provider_first_name'] =
      params['member_last_name'] = params['member_first_name'] = '1234567890';
    params['payer_id'] = '00001';
    params['member_dob'] = '1981-01-01';

    coverageRequest(params);
  }
}

buildError = function (error) {
  var coverageSection = $("<section/>").addClass("eligible-plugin-coverage-template");

  var ul = $("<ul/>").appendTo(coverageSection);
  $("<li/>", {"text": "Response Code: " + error['response_code']}).appendTo(ul);
  $("<li/>", {"text": "Response Description: " + error['response_description']}).appendTo(ul);
  $("<li/>", {"text": "Agency Qualifier Code: " + error['agency_qualifier_code']}).appendTo(ul);
  $("<li/>", {"text": "Agency Qualifier Description: " + error['agency_qualifier_description']}).appendTo(ul);
  $("<li/>", {"text": "Reject Reason Code: " + error['reject_reason_code']}).appendTo(ul);
  $("<li/>", {"text": "Reject Reason Description: " + error['reject_reason_description']}).appendTo(ul);
  $("<li/>", {"text": "Follow Up Action Code: " + error["follow-up_action_code"]}).appendTo(ul);
  $("<li/>", {"text": "Follow Up Action Description: " + error["follow-up_action_description"]}).appendTo(ul);
  $("<li/>", {"text": "Details: " + error['details']}).appendTo(ul);

  var body = $('body');
  coverageSection.appendTo(body);
}


buildCoverageHTML = function (data) {
  var coverageSection = $("<section/>").addClass("eligible-plugin-coverage-template");

  // Build demographics
  if (data['demographics']) {
    if (data['demographics']['subscriber'] && data['demographics']['subscriber']['first_name']) {
      coverageSection.append(buildPanelUI('Subscriber', buildDemographics(data['demographics']['subscriber'], "Subscriber")));
    }
    if (data['demographics']['dependent'] && data['demographics']['dependent']['first_name']) {
      coverageSection.append(buildPanelUI('Dependent', buildDemographics(data['demographics']['dependent'], "Dependent")));
    }
  }

  // Build primary insurance
  if (data['primary_insurance'] && data['primary_insurance']['name']) {
    coverageSection.append(buildPanelUI('Primary Insurance', buildPrimaryInsurance(data['primary_insurance'])));
  }

  // Build plan detail
  if (data['plan'] && data['plan']['coverage_status']) {
    coverageSection.append(buildPanelUI('Plan', buildPlan(data['plan'])));
  }

  // Build additional insurance policies
  if (data['plan'] && data['plan']['additional_insurance_policies'] && data['plan']['additional_insurance_policies'].length > 0) {
    coverageSection.append(buildPanelUI('Additional Insurance Policies', buildAdditionalInsurancePolicies(data['plan']['additional_insurance_policies'])));
  }

  // Build plan coverage
  if (data['plan'] && data['plan']['financials']) {
    coverageSection.append(buildPanelUI('Health Benefit Plan Coverage', buildFinancials(data['plan']['financials'])));
  }

  // Adding Service details
  if (data['services'] && data['services'].length > 0) {
    $.each(data['services'], function(idx, service) {
      console.log(service);
      console.log(coverageStatus(service));
      if (coverageStatus(service) == "Active") {
        coverageSection.append(buildPanelUI(service['type_label'], buildFinancials(service['financials'])));
      }
    });
  }

  var body = $('body');
  var subscriberSection = $(document.createElement('section')).addClass('subscriber-section');

  coverageSection.appendTo(body);
  subscriberSection.prependTo(coverageSection);

  // Adding classes for styling --
  $('.primary-id').closest('.panel')

};

buildPanelUI = function (title, content) {
  var panel = $('<div class="panel panel-default">');
  panel.append($('<div class="panel-heading"><h4>' + title + '</h4></div>'));
  var contentPanel = $('<div class="panel-body"></div>');
  contentPanel.append(content);
  panel.append(contentPanel);

  // --
  panel.addClass(title.replace(/ /g,'-').toLowerCase());
  return panel;
}

buildDemographics = function (person) {
  var table = $("<table class=\"table table-hover\"/>");
  var tableHead = $("<thead></thead>").appendTo(table);
  var rowHead = $("<tr></tr>").appendTo(tableHead);
  var tableBody = $("<tbody/>").appendTo(table);
  var row = $("<tr></tr>").appendTo(tableBody);

  $("<th/>", {text: "Primary ID"}).appendTo(rowHead).addClass('primary-id');
  $("<td/>", {text: person['member_id']}).appendTo(row);

  $("<th/>", {text: "Name / Address"}).appendTo(rowHead);
  $("<td/>", {html: parseNameAndAddress(person).join("<br/>")}).appendTo(row);

  $("<th/>", {text: "Date of Birth"}).appendTo(rowHead);
  $("<td/>", {text: person['dob']}).appendTo(row);

  $("<th/>", {text: "Gender"}).appendTo(rowHead);
  $("<td/>", {text: parseGender(person['gender'])}).appendTo(row);

  $("<th/>", {text: "Additional Information"}).appendTo(rowHead);
  $("<td/>", {html: parsePersonAdditionalInfo(person).join("<br/>")}).appendTo(row);

  return(table);
}

parseNameAndAddress = function (person) {
  var result = new Array();

  result.push(parseName(person));

  if (person['address']) {
    result = result.concat(parseAddress(person['address']));
  }

  return(result);
}

parseGender = function (gender) {
  if (gender == 'F') {
    return "Female";
  } else if (gender == 'M') {
    return "Male";
  } else {
    return '';
  }
}

parsePersonAdditionalInfo = function (person) {
  var additionalInformation = new Array();
  if (person['group_id']) {
    additionalInformation.push("Group ID: " + person['group_id']);
  }
  if (person['group_name']) {
    additionalInformation.push("Group Name: " + person['group_name']);
  }
  return additionalInformation;
}

buildPrimaryInsurance = function (primaryInsurance) {
  var table = $("<table class=\"table table-hover\"/>");
  var tableHead = $("<thead></thead>").appendTo(table);
  var rowHead = $("<tr></tr>").appendTo(tableHead);
  var tableBody = $("<tbody/>").appendTo(table);
  var row = $("<tr></tr>").appendTo(tableBody);

  $("<th/>", {text: "Name"}).appendTo(rowHead);
  $("<td/>", {text: primaryInsurance['name']}).appendTo(row);

  $("<th/>", {text: "ID"}).appendTo(rowHead);
  $("<td/>", {text: primaryInsurance['id']}).appendTo(row);

  $("<th/>", {text: "Contacts"}).appendTo(rowHead);
  $("<td/>", {html: parseContacts(primaryInsurance['contacts']).join("<br/>")}).appendTo(row);

  return(table);
}

buildPlan = function (plan) {
  var table = $("<table class=\"table table-hover\"/>");
  var tableHead = $("<thead></thead>").appendTo(table);
  var rowHead = $("<tr></tr>").appendTo(tableHead);
  var tableBody = $("<tbody/>").appendTo(table);
  var row = $("<tr></tr>").appendTo(tableBody);

  rowHead.append("<th>Coverage Status</th>");
  row.append("<td>" + coverageStatus(plan) + "</td>")

  if (plan['plan_name'] && plan['plan_name'].length > 0) {
    $("<th/>", {text: "Plan Name"}).appendTo(rowHead);
    $("<td/>", {text: plan['plan_name']}).appendTo(row);
  }

  if (plan['plan_type_label'] && plan['plan_type_label'].length > 0) {
    $("<th/>", {text: "Plan Type"}).appendTo(rowHead);
    $("<td/>", {text: plan['plan_type_label']}).appendTo(row);
  }

  if (plan['group_name'] && plan['group_name'].length > 0) {
    $("<th/>", {text: "Group Name"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_name']}).appendTo(row);
  }

  if (plan['plan_number'] && plan['plan_number'].length > 0) {
    $("<th/>", {text: "Plan Number"}).appendTo(rowHead);
    $("<td/>", {text: plan['plan_number']}).appendTo(row);
  }

  if (plan['dates']) {
    var eligibleDates = getTypeSpecificDates(plan['dates'], "eligibilty");
    var planDates = getTypeSpecificDates(plan['dates'], "plan");
    var serviceDates = getTypeSpecificDates(plan['dates'], "service");

    if (eligibleDates && eligibleDates.length > 0) {
      $("<th/>", {text: "Eligible"}).appendTo(rowHead);
      $("<td/>", {text: eligibleDates}).appendTo(row);
    }

    if (planDates && planDates.length > 0) {
      $("<th/>", {text: "Plan"}).appendTo(rowHead);
      $("<td/>", {text: planDates}).appendTo(row);
    }

    if (serviceDates && serviceDates.length > 0) {
      $("<th/>", {text: "Service"}).appendTo(rowHead);
      $("<td/>", {text: serviceDates}).appendTo(row);
    }
  }

  return(table);
}

buildAdditionalInsurancePolicies = function (additionalPolicies) {
  var table = $("<table class=\"table table-hover\"/>");
  var tableHead = $("<thead></thead>").appendTo(table);
  var rowHead = $("<tr></tr>").appendTo(tableHead);
  var tableBody = $("<tbody/>").appendTo(table);

  $("<th/>", {text: "Insurance Type"}).appendTo(rowHead);
  $("<th/>", {text: "Coverage Description"}).appendTo(rowHead);
  $("<th/>", {text: "References"}).appendTo(rowHead);
  $("<th/>", {text: "Contact Details"}).appendTo(rowHead);
  $("<th/>", {text: "Dates"}).appendTo(rowHead);
  $("<th/>", {text: "Comments"}).appendTo(rowHead);

  $.each(additionalPolicies, function (index, policy) {
    var row = $("<tr/>").appendTo(tableBody);

    $("<td/>", {text: policy['insurance_type_label']}).appendTo(row);
    $("<td/>", {text: policy['coverage_description']}).appendTo(row);
    $("<td/>", {html: parseReference(policy['reference']).join("<br/>")}).appendTo(row);
    $("<td/>", {html: parseContactDetails(policy['contact_details']).join("<br/>")}).appendTo(row);
    $("<td/>", {html: parseDates(policy['dates']).join("<br/>")}).appendTo(row);
    $("<td/>", {html: parseComments(policy['comments']).join("<br/>")}).appendTo(row);
  });

  return(table);
}

buildFinancials = function(data) {
  var table = $("<table class=\"table table-hover\"/>");
  var tableHead = $("<thead></thead>").appendTo(table);
  var rowHead = $("<tr></tr>").appendTo(tableHead);
  var tableBody = $("<tbody/>").appendTo(table);
  var rows = null;

  $("<th/>", {text: "Network"}).appendTo(rowHead);
  $("<th/>", {text: "Coverage"}).appendTo(rowHead);
  $("<th/>", {text: "Type"}).appendTo(rowHead);
  $("<th/>", {text: "Value"}).appendTo(rowHead);
  $("<th/>", {text: "Period"}).appendTo(rowHead);
  $("<th/>", {text: "Additional Information"}).appendTo(rowHead);

  // 1st In Network Individual
  rows = buildFinancialRows(data, 'in_network', 'INDIVIDUAL');
  if (rows.length > 0) {
    $(rows[0]).addClass("warning");
    $(rows[0]).children().eq(0).text('In');
    $(rows[0]).children().eq(1).text('Individual');
    $.each(rows, function(idx, row) {
      tableBody.append(row);
    });
  }

  // 2nd In Network Family
  rows = buildFinancialRows(data, 'in_network', 'FAMILY');
  if (rows.length > 0) {
    $(rows[0]).addClass("warning");
    $(rows[0]).children().eq(0).text('In');
    $(rows[0]).children().eq(1).text('Family');
    $.each(rows, function(idx, row) {
      tableBody.append(row);
    });
  }

  // 3rd Out Network Individual
  rows = buildFinancialRows(data, 'out_network', 'INDIVIDUAL');
  if (rows.length > 0) {
    $(rows[0]).addClass("warning");
    $(rows[0]).children().eq(0).text('Out');
    $(rows[0]).children().eq(1).text('Individual');
    $.each(rows, function(idx, row) {
      tableBody.append(row);
    });
  }

  // 4rd Out Network Family
  rows = buildFinancialRows(data, 'out_network', 'FAMILY');
  if (rows.length > 0) {
    $(rows[0]).addClass("warning");
    $(rows[0]).children().eq(0).text('Out');
    $(rows[0]).children().eq(1).text('Family');
    $.each(rows, function(idx, row) {
      tableBody.append(row);
    });
  }

  return(table);
}

buildFinancialRows = function(data, network, level) {
  var rows = new Array();

  $.each(data, function(key) {
    item = data[key];
    if (typeof(item) === 'object') {
      // Remainings
      if (item['remainings'] && item['remainings'][network] && item['remainings'][network].length > 0) {
        $.each(item['remainings'][network], function(idx, info) {
          if (info['level'] == level) {
            rows.push(buildFinancialRow(network, level, key, 'Remain', info));
          }
        });
      }
      // Totals
      if (item['totals'] && item['totals'][network] && item['totals'][network].length > 0) {
        $.each(item['totals'][network], function(idx, info) {
          if (info['level'] == level) {
            rows.push(buildFinancialRow(network, level, key, info['time_period_label'], info));
          }
        });
      }
      // Percents
      if (item['percents'] && typeof(item['percents']) === 'object') {
        // Remainings
        if (item['percents'][network] && item['percents'][network].length > 0) {
          $.each(item['percents'][network], function(idx, info) {
            if (info['level'] == level) {
              rows.push(buildFinancialRow(network, level, key, 'Remain', info));
            }
          });
        }
        // Totals
        if (item['percents'][network] && item['percents'][network].length > 0) {
          $.each(item['percents'][network], function(idx, info) {
            if (info['level'] == level) {
              rows.push(buildFinancialRow(network, level, key, info['time_period_label'], info));
            }
          });
        }
      }
      // Amounts
      if (item['amounts'] && typeof(item['amounts']) === 'object') {
        // Remainings
        if (item['amounts'][network] && item['amounts'][network].length > 0) {
          $.each(item['amounts'][network], function(idx, info) {
            if (info['level'] == level) {
              rows.push(buildFinancialRow(network, level, key, 'Remain', info));
            }
          });
        }
        // Totals
        if (item['amounts'][network] && item['amounts'][network].length > 0) {
          $.each(item['amounts'][network], function(idx, info) {
            if (info['level'] == level) {
              rows.push(buildFinancialRow(network, level, key, info['time_period_label'], info));
            }
          });
        }
      }
    }
  });

  return(rows);
}

buildFinancialRow = function(network, level, type, period, item) {
  row = $("<tr/>");
  $("<td/>").appendTo(row);
  $("<td/>").appendTo(row);
//  if (network == 'in_network')
//    $("<td/>", {text: 'In'}).appendTo(row);
//  else
//    $("<td/>", {text: 'Out'}).appendTo(row);
//  $("<td/>", {text: level}).appendTo(row);
  $("<td/>", {text: type}).appendTo(row);
  if (item['amount'] && item['amount'].length > 0)
    $("<td/>", {text: "$ " + item['amount'] + ".00"}).appendTo(row);
  else if (item['percent'] && item['percent'].length > 0)
    $("<td/>", {text: "% " +item['percent']}).appendTo(row);
  $("<td/>", {text: period}).appendTo(row);

  var extra_info = new Array();
  if (item['insurance_type_label'] && item['insurance_type_label'].length > 0) {
    extra_info.push(item['insurance_type_label']);
  }
  if (item['comments'] && item['comments'].length > 0) {
    $.each(item['comments'], function(idx, value) {
      extra_info.push(value);
    });
  }

  $("<td/>", {html: extra_info.join("</br>")}).appendTo(row);
  return(row);
}

getTypeSpecificDates = function (dates, type) {
  var start;
  var end;
  $.each(dates, function (index, date) {
    if (date.date_type == type || date.date_type == type + "_begin") {
      start = date.date_value;
    } else if (date.date_type == type + "_end") {
      end = date.date_value;
    }
  });
  return formatDates(start, end);
};

formatDates = function (start, end) {
  if ((start == undefined || start == "") && (end == undefined || end == "")) {
    return "";
  } else if (start == undefined || start == "") {
    return end;
  } else if (end == undefined || end == "") {
    return start;
  } else {
    return start + " to " + end;
  }
};


parseReference = function (reference) {
  var result = new Array();

  $.each(reference, function (index, current) {
    result.push(current.reference_label + ": " + current.reference_number);
  });

  return result;
};

parseDates = function (dates) {
  var list = new Array();

  $.each(dates, function (index, current) {
    list.push(current.date_type + ": " + current.date_value);
  });

  return(list);
};

parseComments = function (comments) {
  var list = new Array();

  $.each(comments, function (index, comment) {
    list.push(comment);
  });

  return(list);
};

parseContactDetails = function (contactDetails) {
  var list = new Array();
  $.each(contactDetails, function (index, details) {
    var detailsList = new Array();
    detailsList.push(parseName(details));
    if (details['address'] && details['address']['street_line_1']) {
      detailsList.push(parseAddress(details['address']));
    }
    if (details['contacts'] && details['contacts'].length > 0) {
      detailsList.push(parseContacts(details['contacts']));
    }
    list.push(detailsList);
  });
  return(list);
};

parseName = function (data) {
  firstName = data['first_name'];
  lastName = data['last_name'];

  if (isPresent(firstName) && isPresent(lastName)) {
    return(firstName + " " + lastName);
  } else if (isPresent(firstName)) {
    return(firstName);
  } else if (isPresent(lastName)) {
    return(lastName);
  } else {
    return "";
  }
};

parseAddress = function (addressData) {
  var list = new Array();
  if (addressData['street_line_1'] && addressData['street_line_1'].length > 0) {
    list.push(addressData['street_line_1']);
    if (addressData['street_line_2'] && addressData['street_line_2'].length > 0) {
      list.push(addressData['street_line_2']);
    }
  }

  if (addressData['city']) {
    if (addressData['city'] == addressData['state']) {
      list.push(addressData['state'] + ", " + addressData['zip']);
    } else {
      list.push(addressData['city'] + ", " + addressData['state'] + ", " + addressData['zip']);
    }
  }

  return(list);
};

parseContacts = function (contactData) {
  var contacts = new Array();

  $.each(contactData, function (index, contact) {
    contacts.push(capitalise(contact.contact_type) + ": " + contact.contact_value);
  });

  return contacts;
};

capitalise = function (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

isPresent = function (object) {
  if (object == undefined || object == null || object == "") {
    return false;
  } else {
    return true;
  }
};

coverageStatus = function (data) {
  var status;
  if (data.coverage_status == "1" || data.coverage_status == "2" || data.coverage_status == "3" || data.coverage_status == "4" || data.coverage_status == "5") {
    status = "Active";
  } else {
    status = "Inactive";
  }

  return status;
};