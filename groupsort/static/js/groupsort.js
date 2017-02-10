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

var sort_groups = function(pairings, groups_data) {
    var ordered_people = [];
    var groups = [];

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
            'size': group.size
        });
    });

    while (ordered_people.length > 0) {
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

    return groups;
};
