# SPDX-License-Identifier: Apache-2.0
"""Host-only teaching contracts. No function here grants GPU evidence."""
import re


def verify_increment(values, n):
    """Check every logical result and the separately allocated write guard."""
    if len(values) != n + 1 or values[:n] != [i + 1 for i in range(n)]:
        raise ValueError('logical output mismatch')
    if values[n] != -999:
        raise ValueError('write guard changed')


def assignments(tiles, programs):
    """Model cyclic ownership, not physical residency or execution order."""
    if type(tiles) is not int or type(programs) is not int or tiles < 1 or not 1 <= programs <= tiles:
        raise ValueError('require positive integer tiles and 1 <= programs <= tiles')
    return [list(range(p, tiles, programs)) for p in range(programs)]


def sanitizer_summary(text, tool, exit_code):
    """Export only bounded enums/counts; never copy raw text or arbitrary fields.

    Input is a private log. This deliberately lossy derivative cannot replace it.
    A clean or nonzero tool exit never automatically certifies kernel correctness.
    """
    if tool not in ('memcheck', 'racecheck', 'initcheck', 'synccheck'):
        raise ValueError('unknown tool')
    if type(exit_code) is not int or not 0 <= exit_code <= 255:
        raise ValueError('invalid process exit code')
    matches = re.findall(r'^========= ERROR SUMMARY: ([0-9]{1,9}) errors?\s*$', text, re.MULTILINE)
    # Multiple processes/summaries need manual review; do not select a convenient one.
    count = int(matches[0]) if len(matches) == 1 else None
    return {'schemaVersion': 1, 'tool': tool, 'exitCode': exit_code,
            'reportedErrors': count, 'summaryRecognized': count is not None,
            'derivative': 'counts-only', 'requiresPrivateLogReview': True,
            'runtimeEvidence': 'Pending Hardware Verification'}
