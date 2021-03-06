import { reporters } from 'mocha';
import * as moment from 'moment';
import { TestRail } from './testrail';
import { titleToCaseIds } from './shared';
import { Status, TestRailResult } from './testrail.interface';
const chalk = require('chalk');

export class CypressTestRailReporter extends reporters.Spec {
  private testRail: TestRail;
  private results;

  constructor(runner: any, options: any) {
    super(runner);

    let reporterOptions = options.reporterOptions;
    this.testRail = new TestRail(reporterOptions);
    this.validate(reporterOptions, 'domain');
    this.validate(reporterOptions, 'username');
    this.validate(reporterOptions, 'password');
    this.validate(reporterOptions, 'projectId');
    this.validate(reporterOptions, 'suiteId');

    runner.on('start', () => {
      const name = `${reporterOptions.runName || 'Automated test run'}`;
      const description = 'For the Cypress run visit https://dashboard.cypress.io/#/projects/runs';
      this.testRail.createRun(name, description);
    });

    runner.on('pass', test => {
      const caseIds = titleToCaseIds(test.title);
      if (caseIds.length > 0) {
        this. results = caseIds.map(caseId => {
          return {
            case_id: caseId,
            status_id: Status.Passed,
            comment: `Execution time: ${test.duration}ms`,
          };
        });
      }
    });

    runner.on('fail', test => {
      const caseIds = titleToCaseIds(test.title);
      if (caseIds.length > 0) {
        this. results = caseIds.map(caseId => {
          return {
            case_id: caseId,
            status_id: Status.Failed,
            comment: `${test.err.message}`,
          };
        });
      }
    });

    runner.on('end', () => {
      this.testRail.publishResults(this.results);
    })
  }

  private validate(options, name: string) {
    if (options == null) {
      throw new Error('Missing reporterOptions in cypress.json');
    }
    if (options[name] == null) {
      throw new Error(`Missing ${name} value. Please update reporterOptions in cypress.json`);
    }
  }
}
