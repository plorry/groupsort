    var ajax = {};
    ajax.x = function () {
        if (typeof XMLHttpRequest !== 'undefined') {
            return new XMLHttpRequest();
        }
        var versions = [
            "MSXML2.XmlHttp.6.0",
            "MSXML2.XmlHttp.5.0",
            "MSXML2.XmlHttp.4.0",
            "MSXML2.XmlHttp.3.0",
            "MSXML2.XmlHttp.2.0",
            "Microsoft.XmlHttp"
        ];

        var xhr;
        for (var i = 0; i < versions.length; i++) {
            try {
                xhr = new ActiveXObject(versions[i]);
                break;
            } catch (e) {
            }
        }
        return xhr;
    };

    ajax.send = function (url, callback, method, data, async) {
        if (async === undefined) {
            async = true;
        }
        var x = ajax.x();
        x.open(method, url, async);
        x.onreadystatechange = function () {
            if (x.readyState == 4) {
                callback(x.responseText)
            }
        };
        if (method == 'POST') {
            x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }
        x.send(data)
    };

    ajax.get = function (url, data, callback, async) {
        var query = [];
        for (var key in data) {
            query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
        ajax.send(url + (query.length ? '?' + query.join('&') : ''), callback, 'GET', null, async)
    };

    ajax.post = function (url, data, callback, async) {
        var query = [];
        for (var key in data) {
            query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
        ajax.send(url, callback, 'POST', query.join('&'), async)
    };

    /*********************************************************
    Now the real stuff
    *********************************************************/
function main() {
    var addNamelistButton = document.getElementById('new_namelist');
    var addPersonButton = document.getElementById('new_person');
    var launchGroupsButton = document.getElementById('make_groups');
    var addGroupsButton = document.getElementById('add-group');
    var subGroupsButton = document.getElementById('sub-group');
    var createGroupsButton = document.getElementById('create-groups');
    var saveGroupsButton = document.getElementById('save-groups');

    addNamelistButton.addEventListener("click", function(){
        NAMELISTS.ACTIONS.create_new();
    });
    addPersonButton.addEventListener("click", function(){
        MEMBERS.ACTIONS.create_new();
    });
    launchGroupsButton.addEventListener("click", function(){
        GROUPS.ACTIONS.launchSetup();
    });

    addGroupsButton.addEventListener("click", function(){
        GROUPS.ACTIONS.addGroup();
    });
    subGroupsButton.addEventListener("click", function(){
        GROUPS.ACTIONS.subGroup();
    });

    createGroupsButton.addEventListener("click", function() {
        GROUPS.ACTIONS.createGroups();
    });

    saveGroupsButton.addEventListener('click', function () {
        SAVEDGROUPS.ACTIONS.saveGroups();
    });
    NAMELISTS.ACTIONS.set_all();
    MEMBERS.ACTIONS.set_all();
    GROUPS.ACTIONS.set_all();
    SAVEDGROUPS.ACTIONS.init();
};

var TOKEN = '';

function setToken(token) {
    TOKEN = token;
};

    var NAMELISTS = {
        ATTRIBUTES: {
            'selectedNamelist': null
        },
        ACTIONS: {
            set_all: function() {
                var elements = NAMELISTS.ACTIONS.gather_all();
                elements.forEach(function(e) {
                    e.addEventListener("click", NAMELISTS.ACTIONS.select);
                });
                NAMELISTS.ELEMENTS = {
                    new_title: document.getElementById('new_namelist_title'),
                    list: document.getElementById('namelists'),
                    groups_url: document.getElementById('groups-url')
                }
            },
            create_new: function() {
                var data = {
                    'title': NAMELISTS.ACTIONS.get_namelist_title(),
                    'csrfmiddlewaretoken': TOKEN
                };
                ajax.post('/add_namelist/', data, NAMELISTS.ACTIONS.retrieve, true);
                NAMELISTS.ELEMENTS.new_title.value = '';
            },

            get_namelist_title: function() {
                var title = NAMELISTS.ELEMENTS.new_title.value;
                return title;
            },

            retrieve: function() {
                ajax.get('/get_namelists/', {}, NAMELISTS.ACTIONS.update_list, true);
            },

            update_list: function(response) {
                response = JSON.parse(response)
                titles = response.titles;
                var new_list = '';
                titles.forEach(function(title){
                    new_list += (NAMELISTS.TEMPLATES.title(title));
                });
                NAMELISTS.ELEMENTS.list.innerHTML = new_list;
                NAMELISTS.ACTIONS.set_all();
            },
            select: function(element) {
                var elements = NAMELISTS.ACTIONS.gather_all();
                elements.forEach(function(e) {
                    e.setAttribute("class", "");
                });
                element.target.setAttribute("class", "selected");
                var id = element.target.getAttribute("data-namelist-id");
                NAMELISTS.ATTRIBUTES.selectedNamelist = id;
                MEMBERS.ACTIONS.retrieve();
                NAMELISTS.ACTIONS.update_url();
            },
            gather_all: function() {
                var elements = document.querySelectorAll('#namelists li');
                return elements;
            },
            update_url: function() {
                var url = NAMELISTS.ELEMENTS.groups_url;

                url.setAttribute('href', '/saved_groups/?namelist_id=' + NAMELISTS.ATTRIBUTES.selectedNamelist);
            }
        },

        ELEMENTS: {
        },

        TEMPLATES: {
            title: function(title) {
                return '<li data-namelist-id=' + title.id + '>' + title.title + '</li>';
            }
        }
    }

    var MEMBERS = {
            ATTRIBUTES: {
                'selectedPerson': null,
                'allMembers': []
            },
            ACTIONS: {
                set_all: function() {
                    var elements = MEMBERS.ACTIONS.gather_all();
                    elements.forEach(function(e) {
                        e.addEventListener("click", MEMBERS.ACTIONS.select);
                    });
                    MEMBERS.ELEMENTS = {
                        list: document.getElementById('names'),
                        new_name: document.getElementById('new_person_name'),
                    };
                },
                retrieve: function() {
                    var data = {
                        'namelist': NAMELISTS.ATTRIBUTES.selectedNamelist
                    };
                    ajax.get('/get_namelist/', data, MEMBERS.ACTIONS.update_list, true);
                },
                getMemberById: function(id) {
                  var member = MEMBERS.ATTRIBUTES.allMembers.filter(person => person.id == id);
                  return member[0];
                },
                update_list: function(response) {
                    response = JSON.parse(response)
                    names = response.members;
                    MEMBERS.ATTRIBUTES.allMembers = names;
                    var new_list = '';
                    names.forEach(function(name){
                        new_list += (MEMBERS.TEMPLATES.name(name));
                    });
                    MEMBERS.ELEMENTS.list.innerHTML = new_list;
                    MEMBERS.ACTIONS.set_all();
                },
                create_new: function() {
                    var data = {
                        'name': MEMBERS.ACTIONS.get_person_name(),
                        'namelist_id': NAMELISTS.ATTRIBUTES.selectedNamelist,
                        'csrfmiddlewaretoken':TOKEN
                    };
                    ajax.post('/add_person/', data, MEMBERS.ACTIONS.retrieve, true);
                    MEMBERS.ELEMENTS.new_name.value = '';
                },
                get_person_name: function() {
                    var name = MEMBERS.ELEMENTS.new_name.value;
                    return name;
                },
                select: function(element) {
                    var elements = MEMBERS.ACTIONS.gather_all();
                    elements.forEach(function(e) {
                        e.setAttribute("class", "");
                    });
                    element.target.setAttribute("class", "selected");
                    var id = element.target.getAttribute("data-person-id");
                    MEMBERS.ATTRIBUTES.selectedPerson = id;
                },
                gather_all: function() {
                    var elements = document.querySelectorAll('#names li');
                    return elements;
                }
            },
            ELEMENTS: {
            },
            TEMPLATES: {
                name: function(name) {
                    var text = '<li data-person-id=' + name.id + '>' + name.name + '</li>';
                    return text;
                }
            }
    };

    GROUPS = {
        ATTRIBUTES: {
            numGroups: 3,
            groups: []
        },
        ACTIONS: {
            set_all: function() {
                var elements = GROUPS.ACTIONS.gatherAll();
                elements.forEach(function(e) {
                    var id = e.getAttribute('data-group-num');
                    var nextId = parseInt(id) + 1;
                    if (nextId > GROUPS.ATTRIBUTES.numGroups) {
                        nextId = 1;
                    }
                    var groupSize = parseInt(e.getAttribute('data-group-size'));
                    var addButton = e.querySelector("[data-group-add]");
                    var subButton = e.querySelector("[data-group-sub]");
                    addButton.addEventListener("click", function() {
                        GROUPS.ACTIONS.addToGroup(id);
                        GROUPS.ACTIONS.subFromGroup(nextId);
                    });
                    subButton.addEventListener("click", function() {
                        GROUPS.ACTIONS.subFromGroup(id);
                        GROUPS.ACTIONS.addToGroup(nextId);
                    });
                });
                GROUPS.ELEMENTS = {
                    column: document.getElementById('group-info'),
                    setupList: document.getElementById('groups-setup'),
                    groupCount: document.getElementById('group-count')
                };
            },
            updateGroupCount: function() {
                GROUPS.ELEMENTS.groupCount.innerHTML = GROUPS.ATTRIBUTES.numGroups;
            },
            launchSetup: function() {
                var column = GROUPS.ELEMENTS.column;
                column.style.display = "block";
                GROUPS.ACTIONS.buildGroupTemplates();
                GROUPS.ACTIONS.updateGroupCount();
            },
            hide: function() {
                var column = GROUPS.ELEMENTS.column;
                column.style.display = "none";
            },
            buildGroupTemplates: function() {
                var peopleCount = MEMBERS.ELEMENTS.list.children.length;
                var size = Math.floor( peopleCount / GROUPS.ATTRIBUTES.numGroups );
                var remainder = peopleCount % GROUPS.ATTRIBUTES.numGroups;
                var children = '';
                for (var i=1; i <= GROUPS.ATTRIBUTES.numGroups; i++) {
                    var group = GROUPS.TEMPLATES.group(i, size);
                    children += group;
                }
                GROUPS.ELEMENTS.setupList.innerHTML = children;
                // Now deal with the remainder :(
                if (remainder > 0) {
                    for (var i=1; i <= remainder; i++) {
                        GROUPS.ACTIONS.addToGroup(i);
                    }
                }
                GROUPS.ACTIONS.set_all();
                GROUPS.ACTIONS.updateGroupTemplates();
            },
            addGroup: function() {
                GROUPS.ATTRIBUTES.numGroups++;
                GROUPS.ACTIONS.buildGroupTemplates();
                GROUPS.ACTIONS.updateGroupCount();
            },
            subGroup: function() {
                GROUPS.ATTRIBUTES.numGroups--;
                GROUPS.ACTIONS.buildGroupTemplates();
                GROUPS.ACTIONS.updateGroupCount();
            },
            addToGroup: function(groupNum) {
                var group = GROUPS.ACTIONS.getGroupById(groupNum);
                var size = group.getAttribute("data-group-size");
                size++;
                group.setAttribute("data-group-size", size);
                GROUPS.ACTIONS.updateGroupTemplates();
            },
            subFromGroup: function(groupNum) {
                var group = GROUPS.ACTIONS.getGroupById(groupNum);
                var size = group.getAttribute("data-group-size");
                size--;
                group.setAttribute("data-group-size", size);
                GROUPS.ACTIONS.updateGroupTemplates();
            },
            getGroupById: function(id) {
                var group = document.querySelector('[data-group-num="' + id + '"]');
                return group;
            },
            updateGroupTemplates: function() {
                var groupCount = GROUPS.ATTRIBUTES.numGroups;
                for (var i=1; i <=groupCount; i++) {
                    var group = document.querySelector('[data-group-num="' + i + '"]');
                    var count = group.getAttribute("data-group-size");
                    var countElement = group.querySelector('span');
                    countElement.innerHTML = "A Group of " + count;
                }
            },
            gatherAll: function() {
                var groups = document.querySelectorAll("[data-group-num]");
                return groups;
            },
            sortGroups: function(response) {
                    var ordered_people = [];
                    var groups = [];
                    var groups_data = [];

                    var groupItems = GROUPS.ACTIONS.gatherAll();

                    groupItems.forEach(function(element) {
                        groups_data.push(element.getAttribute("data-group-size"));
                    });

                    response = JSON.parse(response);
                    var pairings = response['pairings'];

                    pairings.forEach(function(pairing) {
                        pairing.people.forEach(function(person) {
                            if (!ordered_people.includes(person)) {
                                ordered_people.push(person);
                            }
                        });
                    });

                    // Create groups, each with a "leader"
                    groups_data.forEach(function(group){
                        groups.push({
                            'people': [ordered_people.pop()],
                            'size': group
                        });
                    });

                    console.log(ordered_people);

                    while (ordered_people.length > 0) {
                        if (groups.length == 0) {
                            window.alert("To re-sort, adjust the settings, and push sort again");
                            break;
                        };
                        groups.forEach(function(group) {
                            if (group.people.length >= group.size) {
                                // group is full
                                return;
                            }
                            var person_to_use = null;
                            var lowest_count = null;

                            ordered_people.forEach(function(person) {
                                var count = 0;

                                group.people.forEach(function(person2){
                                    pairing = pairings.filter(pairing => arraysEqual(pairing.people, [person, person2]));
                                    count += pairing.count;
                                });

                                if (lowest_count == null || count < lowest_count) {
                                    lowest_count = count;
                                    person_to_use = person;
                                }
                            });

                            var index = ordered_people.indexOf(person_to_use);
                            ordered_people.splice(index, 1);
                            group.people.push(person_to_use);
                        });
                    }

                    var return_groups = []
                    groups.forEach(function(group) {
                      var new_group = [];
                      group.people.forEach(function(person) {
                        new_group.push(MEMBERS.ACTIONS.getMemberById(person));
                      });
                      return_groups.push(new_group);
                    });
                    GROUPS.ACTIONS.displayGroups({'groups': return_groups});
            },
            createGroups: function() {
                var namelist_id = NAMELISTS.ATTRIBUTES.selectedNamelist;
                var groups = [];
                var groupItems = GROUPS.ACTIONS.gatherAll();

                groupItems.forEach(function(element) {
                    groups.push(element.getAttribute("data-group-size"));
                });

                data = {
                    'namelist_id': namelist_id,
                    'groups': groups
                };

                ajax.get('/get_pairings', data, GROUPS.ACTIONS.sortGroups, true);
                //ajax.get('/create_groups/', data, GROUPS.ACTIONS.displayGroups, true);
            },
            displayGroups: function(response) {
                var data;
                if (typeof(response) == String) {
                  data = JSON.parse(response);
                } else {
                  data = response;
                }
                SAVEDGROUPS.ATTRIBUTES.saveData = data;
                var groups = data.groups;
                var newElement = ''
                groups.forEach(function(group) {
                    newElement += GROUPS.TEMPLATES.displayGroup(group);
                });
                var setupList = GROUPS.ELEMENTS.setupList;
                setupList.innerHTML = newElement;
                GROUPS.ACTIONS.setGroups();
            },
            dragMember: function(ev) {
              ev.dataTransfer.setData("text", ev.target.id);
            },
            dropMember: function(ev) {
              ev.preventDefault();
              var data = ev.dataTransfer.getData("text");
              var target;
              if (ev.target.tagName == "DIV") {
                target = ev.target;
              } else {
                target = ev.target.parentNode;
              }
              target.appendChild(document.getElementById(data));
              GROUPS.ACTIONS.setGroups();
            },
            getGroups: function() {
                var groups = document.getElementsByClassName('group');
                return groups;
            },
            setGroups: function() {
              // Set the header for each group
              var groups = [].slice.call(GROUPS.ACTIONS.getGroups());
              var groupMembers = [];
              var id, name, member;
              groups.forEach(function(group) {
                  var newGroup = [];
                  var memberItems = [].slice.call(group.getElementsByTagName("li"));
                  memberItems.forEach(function(memberItem){
                      id = memberItem.getAttribute("data-person-id");
                      name = memberItem.getAttribute("data-person-name");
                      member = {'name': name, 'id': id};
                      newGroup.push(member);
                  });
                  groupMembers.push(newGroup);
                  var header = GROUPS.TEMPLATES.groupHeader();
              });
              // Set the save data for the page
              SAVEDGROUPS.ATTRIBUTES.saveData = {'groups': groupMembers};
            }
        },
        ELEMENTS: {
        },
        TEMPLATES: {
            group: function(id, size) {
                return "<li class='full-width' data-group-num=" + id + " data-group-size=" + size + "><span class='count'></span>"
                    + "<div class='small_action_button' data-group-add=" + id + ">+</div>"
                    + "<div class='small_action_button' data-group-sub=" + id + ">-</div></li>";
            },
            displayGroup: function(group) {
                var text = "<div class='group' ondragover='allowDrop(event)' ondrop='GROUPS.ACTIONS.dropMember(event)'><ul>";
                group.forEach(function(person) {
                    text += "<li class='draggable-name' draggable=true id=drag-"+person.id
                        +" ondragstart='GROUPS.ACTIONS.dragMember(event)' data-person-name='"+person.name
                        +"' data-person-id="+person.id+">"
                        + person.name + "</li>";
                });
                text += "</ul></div>"
                return text;
            },
            groupHeader: function(size) {
                var text = "<div class='header'>Group of "+ size +"</div>";
                return text;
            }
        }
    };

    var allowDrop = function(event) {
      event.preventDefault();
    }

    SAVEDGROUPS = {
        ATTRIBUTES: {
            saveData: null
        },
        ACTIONS: {
            init: function() {
                SAVEDGROUPS.ELEMENTS = {
                    list: document.getElementById('saved-groups-list'),
            savedTitle: document.getElementById('save-groups-name')
                };
            },
            saveGroups: function() {
                data = SAVEDGROUPS.ATTRIBUTES.saveData;
                data['csrfmiddlewaretoken'] = TOKEN;
                data['namelist_id'] = NAMELISTS.ATTRIBUTES.selectedNamelist;
                data['group_title'] = SAVEDGROUPS.ELEMENTS.savedTitle.value;
                data['groups'] = JSON.stringify({'groups': data['groups']});
                ajax.post('/save_groups/', data, function(e){
                    window.alert('Groups Saved! View them by clicking "See Saved Groups"')
                }, true);
            }
        },
        ELEMENTS: {
        }
    };



    function arraysEqual(a, b) {
      if (a === b) return true;
      if (a == null || b == null) return false;
      if (a.length != b.length) return false;

      // If you don't care about the order of the elements inside
      // the array, you should sort both arrays here.
      a.sort();
      b.sort();

      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }
