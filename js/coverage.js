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
  // var additionalInsuranceSection;

  // Build demographics
  if (data['demographics']) {
    if (data['demographics']['subscriber'] && data['demographics']['subscriber']['first_name']) {
      coverageSection.append(buildPanelUI('Patient', buildDemographics(data['demographics']['subscriber'], "Subscriber"))); //was 'Subscriber'
    }
    if (data['demographics']['dependent'] && data['demographics']['dependent']['first_name']) {
      coverageSection.append(buildPanelUI('Dependent', buildDemographics(data['demographics']['dependent'], "Dependent")));
    }
  }

  // Build primary insurance
  if (data['primary_insurance'] && data['primary_insurance']['name']) {

    coverageSection.append(buildPanelUI('Primary Insurance', buildPrimaryInsurance(data['primary_insurance'])));

    coverageSection.append(buildPanelUI('Primary Insurance', buildPrimaryInsurance(data['primary_insurance'], data['plan'])));
  }

  // Build plan detail
  if (data['plan'] && data['plan']['coverage_status']) {
    coverageSection.append(buildPanelUI('Plan', buildPlan(data['plan'])));
    // --
    coverageSection.append(buildPanelUI('Plan', buildPlan(data['demographics']['subscriber'])));
    coverageSection.append(buildPanelUI('Plan', buildPlan(data['primary_insurance'])));
  }

  // Build additional insurance policies
  if (data['plan'] && data['plan']['additional_insurance_policies'] && data['plan']['additional_insurance_policies'].length > 0) {
    coverageSection.append(buildPanelUI('Additional Insurance Policies', buildAdditionalInsurancePolicies(data['plan']['additional_insurance_policies'])));

    // additionalInsuranceSection = $(document.createElement('section')).addClass('additional-insurance-section').append('<p>Other insurance policies were found. Click below to see details</p>');
  }

  // Build plan maximums and deductibles
  if (data['plan'] && data['plan']['financials']) {
    coverageSection.append(buildPanelUI('Plan Maximums and Deductibles', buildMaximumDeductibles(data['plan']['financials'])));
  }

  // Build plan coverage
  if (data['plan'] && data['plan']['financials']) {
    coverageSection.append(buildPanelUI('Health Benefit Plan Coverage', buildFinancials(data['plan']['financials'])));
  }

  // Adding Service details
  if (data['services'] && data['services'].length > 0) {
    var div = $("<div/>").addClass("clearfix").addClass("services-div").appendTo(coverageSection);
    $.each(data['services'], function (idx, service) {
      if (coverageStatus(service) == "Active") {
        if (div.children().length == 2) {
          div = $("<div/>").addClass("clearfix").addClass("services-div").appendTo(coverageSection);
        }
        div.append(buildPanelUI(service['type_label'], buildFinancials(service['financials'])));
      }
    });
  }

  var body = $('body');
  var subscriberSection = $("<section/>").addClass('subscriber-section');
  var insuranceSection = $("<section/>").addClass('insurance-section');
  var coverageStatusSection = $("<section/>").addClass('coverage-status-section').append('<h1>Coverage Status</h1><p class="coverage-status"></p>');

  coverageSection.appendTo(body);
  subscriberSection.prependTo(coverageSection);
  insuranceSection.insertAfter(subscriberSection);
  coverageStatusSection.insertAfter(insuranceSection);
  // additionalInsuranceSection.insertAfter(subscriberSection);

  // Adding classes for styling --

  $('.patient').appendTo(subscriberSection);
  $('.dependent').appendTo(subscriberSection);
  $('.primary-insurance').appendTo(insuranceSection); //$('[class*="insurance"]').appendTo(insuranceSection);

  $('.plan').appendTo(insuranceSection);
  coverageStatusSection.find('.coverage-status').text($('.coverage-status-text').text());
};

buildPanelUI = function (title, content) {
  var panel = $('<div class="panel panel-default">');
  panel.append($('<div class="panel-heading"><h4>' + title + '</h4></div>'));
  var contentPanel = $('<div class="panel-body"></div>');
  contentPanel.append(content);
  panel.append(contentPanel);

  panel.addClass(title.replace(/ /g, '-').toLowerCase());
  return panel;
}

buildDemographics = function (person) {
  var table = $("<table class=\"table table-hover\"/>");
  var tableHead = $("<thead></thead>").appendTo(table);
  var rowHead = $("<tr></tr>").appendTo(tableHead);
  var tableBody = $("<tbody/>").appendTo(table);
  var row = $("<tr></tr>").appendTo(tableBody);

  $("<th/>", {text: "Name / Address"}).appendTo(rowHead);
  $("<td/>", {html: parseNameAndAddress(person).join("<br/>")}).appendTo(row);

  // $("<th/>", {text: "Primary ID"}).appendTo(rowHead).addClass('primary-id');
  // $("<td/>", {text: person['member_id']}).appendTo(row);

  $("<th/>", {text: "Date of Birth"}).appendTo(rowHead);
  $("<td/>", {text: person['dob']}).appendTo(row);

  $("<th/>", {text: "Gender"}).appendTo(rowHead);
  $("<td/>", {text: parseGender(person['gender'])}).appendTo(row);

  // $("<th/>", {text: "Additional Information"}).appendTo(rowHead);
  // $("<td/>", {html: parsePersonAdditionalInfo(person).join("<br/>")}).appendTo(row);



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



  $("<th/>", {text: "Insurance Type"}).appendTo(rowHead);
  $("<td/>", {text: "fill in"}).appendTo(row);

  $("<th/>", {text: "Member Type"}).appendTo(rowHead);
  $("<td/>", {text: "fill in"}).appendTo(row);



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

  // var row2 = $("<tr></tr>").appendTo(tableBody);
  // var cell2 = $("<td/>").appendTo(row2);
  // var table2 = $("<table class=\"table table-hover\"/>").appendTo(cell2);

  // var tableHeadInside = $("<thead></thead>").appendTo(table2);
  // var rowHeadInside = $("<tr></tr>").appendTo(tableHeadInside);
  // var tableBodyInside = $("<tbody/>").appendTo(table2);
  // var rowInside = $("<tr></tr>").appendTo(tableBodyInside);


  //temporary solution
  if(plan['member_id']) {

    $("<th/>", {text: "Group ID"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_id']}).appendTo(row);

    $("<th/>", {text: "Group Name"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_name']}).appendTo(row);

    $("<th/>", {text: "Dates"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_name']}).appendTo(row);

    $("<th/>", {text: "Subscriber Info"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_name']}).appendTo(row);

    return(table);
  }

  if(plan['contacts']) {

    $("<th/>", {text: "Group Providers"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_id']}).appendTo(row);

    $("<th/>", {text: "Type"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_name']}).appendTo(row);

    $("<th/>", {text: "Name"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_name']}).appendTo(row);

    $("<th/>", {text: "Contacts"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_name']}).appendTo(row);

    $("<th/>", {text: "Additional Information"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_name']}).appendTo(row);

    return(table);
  }

  rowHead.append("<th>Coverage</th>");
  row.append("<td class='coverage-status-text'>" + coverageStatus(plan) + "</td>");


  if (plan['plan_type_label'] && plan['plan_type_label'].length > 0) {
    $("<th/>", {text: "Type"}).appendTo(rowHead);
    $("<td/>", {text: plan['plan_type_label']}).appendTo(row);
  }

  if (plan['plan_name'] && plan['plan_name'].length > 0) {
    $("<th/>", {text: "Plan Name"}).appendTo(rowHead);
    $("<td/>", {text: plan['plan_name']}).appendTo(row);
  }

  if (plan['plan_number'] && plan['plan_number'].length > 0) {
    $("<th/>", {text: "Plan Number"}).appendTo(rowHead);
    $("<td/>", {text: plan['plan_number']}).appendTo(row);
  }

  rowHead.append("<th>Additional Information</th>");
  row.append("<td>fill in</td>");



  if (plan['group_name'] && plan['group_name'].length > 0) {
    $("<th/>", {text: "Group Name"}).appendTo(rowHead);
    $("<td/>", {text: plan['group_name']}).appendTo(row);
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
};

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
};

buildMaximumDeductibles = function (data) {
  var table = $("<table class=\"table table-hover\"/>");
  var tableHead = $("<thead></thead>").appendTo(table);
  var rowHead = $("<tr></tr>").appendTo(tableHead);
  var rowHead2 = $("<tr></tr>").appendTo(tableHead);
  var tableBody = $("<tbody/>").appendTo(table);
  var rows = null;

  $("<th/>", {rowSpan: 2, text: "Network"}).appendTo(rowHead);
  $("<th/>", {rowSpan: 2, text: "Additional Information"}).appendTo(rowHead);
  $("<th/>", {colSpan: 4, text: "Individual"}).addClass("text-center right-grey-border left-grey-border").appendTo(rowHead);
  $("<th/>", {colSpan: 4, text: "Family"}).addClass("text-center right-grey-border").appendTo(rowHead);
  $("<th/>", {text: "Deductible"}).addClass("left-grey-border").appendTo(rowHead2);
  $("<th/>", {text: "Deductible Remaining"}).appendTo(rowHead2);
  $("<th/>", {text: "Maximum"}).appendTo(rowHead2);
  $("<th/>", {text: "Maximum Remaining"}).addClass("right-grey-border").appendTo(rowHead2);
  $("<th/>", {text: "Deductible"}).appendTo(rowHead2);
  $("<th/>", {text: "Deductible Remaining"}).appendTo(rowHead2);
  $("<th/>", {text: "Maximum"}).appendTo(rowHead2);
  $("<th/>", {text: "Maximum Remaining"}).addClass("right-grey-border").appendTo(rowHead2);

  row1 = new Array(10);
  row1[0] = $("<td/>", {text: "IN"});
  for (var i = 1; i < 10; i++) {
    row1[i] = $("<td/>", {text: ""});
  }
  row2 = new Array(10);
  row2[0] = $("<td/>", {text: "OUT"});
  for (var i = 1; i < 10; i++) {
    row2[i] = $("<td/>", {text: ""});
  }


  $.each(data, function (key) {
    item = data[key];

    if (key == 'deductible') {
      // In Network Deductible Totals
      if (item['totals'] && item['totals']['in_network'] && item['totals']['in_network'].length > 0) {
        $.each(item['totals']['in_network'], function (idx, info) {
          var level = info['level'];
          var amount = null;

          if (info['amount'] && info['amount'].length > 0)
            amount = parseAmount(info['amount']);
          else if (info['percent'] && info['percent'].length > 0)
            amount = "% " + info['percent'];

          if (level == 'INDIVIDUAL') {
            row1[2] = $("<td/>", {text: amount});
          } else {
            row1[6] = $("<td/>", {text: amount});
          }

          var extra_info = new Array();
          if (info['insurance_type_label'] && info['insurance_type_label'].length > 0) {
            extra_info.push(info['insurance_type_label']);
          }
          if (info['comments'] && info['comments'].length > 0) {
            $.each(info['comments'], function (idx, value) {
              extra_info.push(value);
            });
          }
          if (extra_info.length > 0) {
            row1[1] = $("<td/>", {html: extra_info.join("<br/>")});
          }

        });
      }
      // In Network Deductible Remaining
      if (item['remainings'] && item['remainings']['in_network'] && item['remainings']['in_network'].length > 0) {
        $.each(item['remainings']['in_network'], function (idx, info) {
          var level = info['level'];
          var amount = null;

          if (info['amount'] && info['amount'].length > 0)
            amount = parseAmount(info['amount']);
          else if (info['percent'] && info['percent'].length > 0)
            amount = "% " + info['percent'];

          if (level == 'INDIVIDUAL') {
            row1[3] = $("<td/>", {text: amount});
          } else {
            row1[7] = $("<td/>", {text: amount});
          }

          var extra_info = new Array();
          if (info['insurance_type_label'] && info['insurance_type_label'].length > 0) {
            extra_info.push(info['insurance_type_label']);
          }
          if (info['comments'] && info['comments'].length > 0) {
            $.each(info['comments'], function (idx, value) {
              extra_info.push(value);
            });
          }
          if (extra_info.length > 0) {
            row1[1] = $("<td/>", {html: extra_info.join("<br/>")});
          }

        });
      }

      // Out Network Deductible Totals
      if (item['totals'] && item['totals']['out_network'] && item['totals']['out_network'].length > 0) {
        $.each(item['totals']['out_network'], function (idx, info) {
          var level = info['level'];
          var amount = null;

          if (info['amount'] && info['amount'].length > 0)
            amount = parseAmount(info['amount']);
          else if (info['percent'] && info['percent'].length > 0)
            amount = "% " + info['percent'];

          if (level == 'INDIVIDUAL') {
            row2[2] = $("<td/>", {text: amount});
          } else {
            row2[6] = $("<td/>", {text: amount});
          }

          var extra_info = new Array();
          if (info['insurance_type_label'] && info['insurance_type_label'].length > 0) {
            extra_info.push(info['insurance_type_label']);
          }
          if (info['comments'] && info['comments'].length > 0) {
            $.each(info['comments'], function (idx, value) {
              extra_info.push(value);
            });
          }
          if (extra_info.length > 0) {
            row2[1] = $("<td/>", {html: extra_info.join("<br/>")});
          }

        });
      }
      // Out Network Deductible Remaining
      if (item['remainings'] && item['remainings']['out_network'] && item['remainings']['out_network'].length > 0) {
        $.each(item['remainings']['out_network'], function (idx, info) {
          var level = info['level'];
          var amount = null;

          if (info['amount'] && info['amount'].length > 0)
            amount = parseAmount(info['amount']);
          else if (info['percent'] && info['percent'].length > 0)
            amount = "% " + info['percent'];

          if (level == 'INDIVIDUAL') {
            row2[3] = $("<td/>", {text: amount});
          } else {
            row2[7] = $("<td/>", {text: amount});
          }

          var extra_info = new Array();
          if (info['insurance_type_label'] && info['insurance_type_label'].length > 0) {
            extra_info.push(info['insurance_type_label']);
          }
          if (info['comments'] && info['comments'].length > 0) {
            $.each(info['comments'], function (idx, value) {
              extra_info.push(value);
            });
          }
          if (extra_info.length > 0) {
            row2[1] = $("<td/>", {html: extra_info.join("<br/>")});
          }

        });
      }
    }

    if (key == 'stop_loss') {
      // In Network Stop Loss Totals
      if (item['totals'] && item['totals']['in_network'] && item['totals']['in_network'].length > 0) {
        $.each(item['totals']['in_network'], function (idx, info) {
          var level = info['level'];
          var amount = null;

          if (info['amount'] && info['amount'].length > 0)
            amount = parseAmount(info['amount']);
          else if (info['percent'] && info['percent'].length > 0)
            amount = "% " + info['percent'];

          if (level == 'INDIVIDUAL') {
            row1[4] = $("<td/>", {text: amount});
          } else {
            row1[8] = $("<td/>", {text: amount});
          }

          var extra_info = new Array();
          if (info['insurance_type_label'] && info['insurance_type_label'].length > 0) {
            extra_info.push(info['insurance_type_label']);
          }
          if (info['comments'] && info['comments'].length > 0) {
            $.each(info['comments'], function (idx, value) {
              extra_info.push(value);
            });
          }
          if (extra_info.length > 0) {
            row1[1] = $("<td/>", {html: extra_info.join("<br/>")});
          }
        });
      }
      // In Network Stop Loss Remaining
      if (item['remainings'] && item['remainings']['in_network'] && item['remainings']['in_network'].length > 0) {
        $.each(item['remainings']['in_network'], function (idx, info) {
          var level = info['level'];
          var amount = null;

          if (info['amount'] && info['amount'].length > 0)
            amount = parseAmount(info['amount']);
          else if (info['percent'] && info['percent'].length > 0)
            amount = "% " + info['percent'];

          if (level == 'INDIVIDUAL') {
            row1[5] = $("<td/>", {text: amount});
          } else {
            row1[9] = $("<td/>", {text: amount});
          }

          var extra_info = new Array();
          if (info['insurance_type_label'] && info['insurance_type_label'].length > 0) {
            extra_info.push(info['insurance_type_label']);
          }
          if (info['comments'] && info['comments'].length > 0) {
            $.each(info['comments'], function (idx, value) {
              extra_info.push(value);
            });
          }
          if (extra_info.length > 0) {
            row1[1] = $("<td/>", {html: extra_info.join("<br/>")});
          }
        });
      }

      // Out Network Stop Loss Totals
      if (item['totals'] && item['totals']['out_network'] && item['totals']['out_network'].length > 0) {
        $.each(item['totals']['out_network'], function (idx, info) {
          var level = info['level'];
          var amount = null;

          if (info['amount'] && info['amount'].length > 0)
            amount = parseAmount(info['amount']);
          else if (info['percent'] && info['percent'].length > 0)
            amount = "% " + info['percent'];

          if (level == 'INDIVIDUAL') {
            row2[4] = $("<td/>", {text: amount});
          } else {
            row2[8] = $("<td/>", {text: amount});
          }

          var extra_info = new Array();
          if (info['insurance_type_label'] && info['insurance_type_label'].length > 0) {
            extra_info.push(info['insurance_type_label']);
          }
          if (info['comments'] && info['comments'].length > 0) {
            $.each(info['comments'], function (idx, value) {
              extra_info.push(value);
            });
          }
          if (extra_info.length > 0) {
            row2[1] = $("<td/>", {html: extra_info.join("<br/>")});
          }
        });
      }
      // Out Network Stop Loss Remaining
      if (item['remainings'] && item['remainings']['in_network'] && item['remainings']['out_network'].length > 0) {
        $.each(item['remainings']['out_network'], function (idx, info) {
          var level = info['level'];
          var amount = null;

          if (info['amount'] && info['amount'].length > 0)
            amount = parseAmount(info['amount']);
          else if (info['percent'] && info['percent'].length > 0)
            amount = "% " + info['percent'];

          if (level == 'INDIVIDUAL') {
            row2[5] = $("<td/>", {text: amount});
          } else {
            row2[9] = $("<td/>", {text: amount});
          }

          var extra_info = new Array();
          if (info['insurance_type_label'] && info['insurance_type_label'].length > 0) {
            extra_info.push(info['insurance_type_label']);
          }
          if (info['comments'] && info['comments'].length > 0) {
            $.each(info['comments'], function (idx, value) {
              extra_info.push(value);
            });
          }
          if (extra_info.length > 0) {
            row2[1] = $("<td/>", {html: extra_info.join("<br/>")});
          }
        });
      }
    }
  });

  var add_row = false;
  for (var i = 2; i < 10; i++) {
    if ($(row1[i]).text().length > 0)
      add_row = true;
  }
  if (add_row)
    tableBody.append($("<tr/>", {html: row1}));

  add_row = false
  for (var i = 2; i < 10; i++)
    if ($(row2[i]).text().length > 0)
      add_row = true;
  if (add_row)
    tableBody.append($("<tr/>", {html: row2}));

  return(table);
}

buildFinancials = function (data) {
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
    $.each(rows, function (idx, row) {
      tableBody.append(row);
    });
  }

  // 2nd In Network Family
  rows = buildFinancialRows(data, 'in_network', 'FAMILY');
  if (rows.length > 0) {
    $(rows[0]).addClass("warning");
    $(rows[0]).children().eq(0).text('In');
    $(rows[0]).children().eq(1).text('Family');
    $.each(rows, function (idx, row) {
      tableBody.append(row);
    });
  }

  // 3rd Out Network Individual
  rows = buildFinancialRows(data, 'out_network', 'INDIVIDUAL');
  if (rows.length > 0) {
    $(rows[0]).addClass("warning");
    $(rows[0]).children().eq(0).text('Out');
    $(rows[0]).children().eq(1).text('Individual');
    $.each(rows, function (idx, row) {
      tableBody.append(row);
    });
  }

  // 4rd Out Network Family
  rows = buildFinancialRows(data, 'out_network', 'FAMILY');
  if (rows.length > 0) {
    $(rows[0]).addClass("warning");
    $(rows[0]).children().eq(0).text('Out');
    $(rows[0]).children().eq(1).text('Family');
    $.each(rows, function (idx, row) {
      tableBody.append(row);
    });
  }

  return(table);
};

buildFinancialRows = function (data, network, level) {
  var rows = new Array();

  $.each(data, function (key) {
    item = data[key];
    if (typeof(item) === 'object') {
      // Remainings
      if (item['remainings'] && item['remainings'][network] && item['remainings'][network].length > 0) {
        $.each(item['remainings'][network], function (idx, info) {
          if (info['level'] == level) {
            rows.push(buildFinancialRow(network, level, key, 'Remain', info));
          }
        });
      }
      // Totals
      if (item['totals'] && item['totals'][network] && item['totals'][network].length > 0) {
        $.each(item['totals'][network], function (idx, info) {
          if (info['level'] == level) {
            rows.push(buildFinancialRow(network, level, key, info['time_period_label'], info));
          }
        });
      }
      // Percents
      if (item['percents'] && typeof(item['percents']) === 'object') {
        // Remainings
        if (item['percents'][network] && item['percents'][network].length > 0) {
          $.each(item['percents'][network], function (idx, info) {
            if (info['level'] == level) {
              rows.push(buildFinancialRow(network, level, key, 'Remain', info));
            }
          });
        }
        // Totals
        if (item['percents'][network] && item['percents'][network].length > 0) {
          $.each(item['percents'][network], function (idx, info) {
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
          $.each(item['amounts'][network], function (idx, info) {
            if (info['level'] == level) {
              rows.push(buildFinancialRow(network, level, key, 'Remain', info));
            }
          });
        }
        // Totals
        if (item['amounts'][network] && item['amounts'][network].length > 0) {
          $.each(item['amounts'][network], function (idx, info) {
            if (info['level'] == level) {
              rows.push(buildFinancialRow(network, level, key, info['time_period_label'], info));
            }
          });
        }
      }
    }
  });

  return(rows);
};

buildFinancialRow = function (network, level, type, period, item) {
  row = $("<tr/>");
  $("<td/>").appendTo(row);
  $("<td/>").appendTo(row);

 // if (network == 'in_network')
 //   $("<td/>", {text: 'In'}).appendTo(row);
 // else
 //   $("<td/>", {text: 'Out'}).appendTo(row);
 // $("<td/>", {text: level}).appendTo(row);

  $("<td/>", {text: type}).appendTo(row);
  if (item['amount'] && item['amount'].length > 0)
    $("<td/>", {text: "$ " + item['amount'] + ".00"}).appendTo(row);
  else if (item['percent'] && item['percent'].length > 0)
    $("<td/>", {text: "% " + item['percent']}).appendTo(row);
  $("<td/>", {text: period}).appendTo(row);

  var extra_info = new Array();
  if (item['insurance_type_label'] && item['insurance_type_label'].length > 0) {
    extra_info.push(item['insurance_type_label']);
  }
  if (item['comments'] && item['comments'].length > 0) {
    $.each(item['comments'], function (idx, value) {
      extra_info.push(value);
    });
  }

  $("<td/>", {html: extra_info.join("</br>")}).appendTo(row);
  return(row);
};

parseAmount = function (amount) {
  if (amount.indexOf(".")) {
    return("$ " + amount);
  } else {
    return("$ " + amount + ".00");
  }
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