const express = require('express');
const assert = require('assert');
const app = express();
const path = require('path');
const moment = require('moment');
const Pool = require('pg').Pool;
const pool = new Pool({
    user: 'bryon.wicklund',
    host: 'localhost',
    database: 'hermes_development',
    port: 5432,
});

app.use(express.static('public'))
app.set("view engine", "pug")
app.set("views", path.join(__dirname, "views"))

app.get('/campaign/:campaignId', (req, res, next) => {
    // Get Organization and Campaign name
    var orgName = '';
    var campaignName = '';
    var data = {};
    var sql = "SELECT o.name AS org_name, c.name AS camp_name \
               FROM organizations o \
               RIGHT JOIN campaigns c ON o.id = c.organization_id \
               WHERE c.id = $1";
    pool.query(sql, [req.params.campaignId])
        .then(function(results) {
            if(results.rows.length == 0) {
              res.render('not_found');
              return
            }
            orgName = results.rows[0]['org_name'];
            campaignName = results.rows[0]['camp_name'];

            // Get Campaign Behaviors
            sql = "SELECT * \
                   FROM campaign_behaviors cb \
                   RIGHT JOIN behaviors b ON b.id = cb.behavior_id \
                   WHERE campaign_id = $1";

            pool.query(sql, [req.params.campaignId])
                .then(function(results) {
                    for (i = 0; i < results.rows.length - 1; i++) {
                        row = results.rows[i];
                        if (row) {
                            behaviorUkey = "Ukey: " + row['ukey'];
                            data[behaviorUkey] = [];

                            //Redemption Ends On
                            if (results.rows[i]['redemption_ends_on']) {
                                var label = 'Redemption Ends On';
                                var so = moment(row['redemption_ends_on']).format('YYYY-MM-DD');
                                var eo = moment(row['redemption_ends_on']).format('YYYY-MM-DD');
                                data[behaviorUkey].push([label, so, eo]);
                            }


                            //Window
                            if (results.rows[i]['window_starts_on']) {
                                var label = 'Window';
                                var so = moment(row['window_starts_on']).format('YYYY-MM-DD');
                                var eo = moment(row['window_ends_on']).format('YYYY-MM-DD');
                                data[behaviorUkey].push([label, so, eo]);
                            }

                            //Print
                            if (results.rows[i]['visible_print_start_on']) {
                                label = 'Print';
                                so = moment(row['visible_print_start_on']).format('YYYY-MM-DD');
                                eo = moment(row['visible_print_end_on']).format('YYYY-MM-DD');
                                data[behaviorUkey].push([label, so, eo]);
                            }

                            //Web
                            if (results.rows[i]['visible_web_start_on']) {
                                label = 'Web';
                                so = moment(row['visible_web_start_on']).format('YYYY-MM-DD');
                                eo = moment(row['visible_web_end_on']).format('YYYY-MM-DD');
                                data[behaviorUkey].push([label, so, eo]);
                            }

                            //Agent
                            if (results.rows[i]['visible_agent_start_on'] && results.rows[i]['visible_agent_end_on']) {
                                var label = 'Agent';
                                var so = moment(row['visible_agent_start_on']).format('YYYY-MM-DD');
                                var eo = moment(row['visible_agent_end_on']).format('YYYY-MM-DD');
                                data[behaviorUkey].push([label, so, eo]);
                            }

                        }
                    }
                    res.render('campaign', {
                        campaignName: campaignName,
                        orgName: orgName,
                        data: data
                    });
                })
                .catch(e => console.error(e.stack));
        })
        .catch(e => console.error(e.stack));
});

app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});
